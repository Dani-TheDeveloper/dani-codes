from typing import List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Lease, LeaseStatus, Property, PropertyStatus, User, UserRole, Notification, NotificationType
from app.schemas import LeaseCreate, LeaseOut, LeaseUpdate
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/leases", tags=["Leases"])


@router.get("/", response_model=List[LeaseOut])
def list_leases(
    status: Optional[str] = None,
    tenant_id: Optional[int] = None,
    property_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Lease).options(joinedload(Lease.tenant), joinedload(Lease.property))
    if current_user.role == UserRole.TENANT:
        q = q.filter(Lease.tenant_id == current_user.id)
    if status:
        q = q.filter(Lease.status == status)
    if tenant_id:
        q = q.filter(Lease.tenant_id == tenant_id)
    if property_id:
        q = q.filter(Lease.property_id == property_id)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=LeaseOut, status_code=201)
def create_lease(
    lease_in: LeaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    prop = db.query(Property).filter(Property.id == lease_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.status = PropertyStatus.OCCUPIED
    lease = Lease(**lease_in.model_dump())
    db.add(lease)
    db.commit()
    db.refresh(lease)
    return lease


@router.get("/{lease_id}", response_model=LeaseOut)
def get_lease(lease_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lease = (
        db.query(Lease)
        .options(joinedload(Lease.tenant), joinedload(Lease.property))
        .filter(Lease.id == lease_id)
        .first()
    )
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    if current_user.role == UserRole.TENANT and lease.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return lease


@router.put("/{lease_id}", response_model=LeaseOut)
def update_lease(
    lease_id: int,
    updates: LeaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    lease = db.query(Lease).filter(Lease.id == lease_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        if field == "status":
            setattr(lease, field, LeaseStatus(value))
        else:
            setattr(lease, field, value)
    db.commit()
    db.refresh(lease)
    return lease


@router.post("/{lease_id}/renew", response_model=LeaseOut)
def renew_lease(
    lease_id: int,
    new_end_date: date,
    new_rent: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    lease = db.query(Lease).filter(Lease.id == lease_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    lease.end_date = new_end_date
    if new_rent is not None:
        lease.rent_amount = new_rent
    lease.status = LeaseStatus.ACTIVE
    notification = Notification(
        user_id=lease.tenant_id,
        title="Lease Renewed",
        message=f"Your lease has been renewed until {new_end_date}.",
        notification_type=NotificationType.LEASE_RENEWAL,
    )
    db.add(notification)
    db.commit()
    db.refresh(lease)
    return lease
