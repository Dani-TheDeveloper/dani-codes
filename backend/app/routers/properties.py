from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Property, PropertyStatus, User, UserRole
from app.schemas import PropertyCreate, PropertyOut, PropertyUpdate
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/properties", tags=["Properties"])


@router.get("/", response_model=List[PropertyOut])
def list_properties(
    status: Optional[str] = None,
    search: Optional[str] = None,
    property_type: Optional[str] = None,
    min_rent: Optional[float] = None,
    max_rent: Optional[float] = None,
    bedrooms: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(Property)
    if status:
        q = q.filter(Property.status == status)
    if search:
        q = q.filter(
            (Property.name.ilike(f"%{search}%"))
            | (Property.address.ilike(f"%{search}%"))
            | (Property.city.ilike(f"%{search}%"))
        )
    if property_type:
        q = q.filter(Property.property_type == property_type)
    if min_rent is not None:
        q = q.filter(Property.rent_amount >= min_rent)
    if max_rent is not None:
        q = q.filter(Property.rent_amount <= max_rent)
    if bedrooms is not None:
        q = q.filter(Property.bedrooms >= bedrooms)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=PropertyOut, status_code=201)
def create_property(
    prop: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    db_prop = Property(**prop.model_dump())
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.put("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: int,
    updates: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        if field == "status":
            setattr(prop, field, PropertyStatus(value))
        else:
            setattr(prop, field, value)
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"detail": "Property deleted"}
