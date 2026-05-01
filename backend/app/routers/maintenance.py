from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    MaintenanceRequest, MaintenanceStatus, MaintenancePriority,
    User, UserRole, Notification, NotificationType,
)
from app.schemas import MaintenanceCreate, MaintenanceOut, MaintenanceUpdate
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])


@router.get("/", response_model=List[MaintenanceOut])
def list_maintenance(
    status: Optional[str] = None,
    property_id: Optional[int] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(MaintenanceRequest)
    if current_user.role == UserRole.TENANT:
        q = q.filter(MaintenanceRequest.requested_by == current_user.id)
    if status:
        q = q.filter(MaintenanceRequest.status == status)
    if property_id:
        q = q.filter(MaintenanceRequest.property_id == property_id)
    if priority:
        q = q.filter(MaintenanceRequest.priority == priority)
    return q.order_by(MaintenanceRequest.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=MaintenanceOut, status_code=201)
def create_maintenance(
    req: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    maint = MaintenanceRequest(
        property_id=req.property_id,
        requested_by=current_user.id,
        title=req.title,
        description=req.description,
        priority=MaintenancePriority(req.priority),
    )
    db.add(maint)
    db.commit()
    db.refresh(maint)
    return maint


@router.put("/{request_id}", response_model=MaintenanceOut)
def update_maintenance(
    request_id: int,
    updates: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    maint = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
    if not maint:
        raise HTTPException(status_code=404, detail="Request not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        if field == "status":
            setattr(maint, field, MaintenanceStatus(value))
        elif field == "priority":
            setattr(maint, field, MaintenancePriority(value))
        else:
            setattr(maint, field, value)
    db.commit()

    notification = Notification(
        user_id=maint.requested_by,
        title="Maintenance Update",
        message=f"Your maintenance request '{maint.title}' has been updated to '{maint.status.value}'.",
        notification_type=NotificationType.MAINTENANCE_UPDATE,
    )
    db.add(notification)
    db.commit()
    db.refresh(maint)
    return maint


@router.get("/{request_id}", response_model=MaintenanceOut)
def get_maintenance(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    maint = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
    if not maint:
        raise HTTPException(status_code=404, detail="Request not found")
    return maint
