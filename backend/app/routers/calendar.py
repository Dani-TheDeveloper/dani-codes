from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import CalendarEvent, User, UserRole
from app.schemas import CalendarEventCreate, CalendarEventOut, CalendarEventUpdate
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])


@router.get("/", response_model=List[CalendarEventOut])
def list_events(
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    event_type: Optional[str] = None,
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(CalendarEvent)
    if start:
        q = q.filter(CalendarEvent.start_time >= start)
    if end:
        q = q.filter(CalendarEvent.start_time <= end)
    if event_type:
        q = q.filter(CalendarEvent.event_type == event_type)
    if property_id:
        q = q.filter(CalendarEvent.property_id == property_id)
    return q.order_by(CalendarEvent.start_time).all()


@router.post("/", response_model=CalendarEventOut, status_code=201)
def create_event(
    event: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    db_event = CalendarEvent(**event.model_dump(), created_by=current_user.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.put("/{event_id}", response_model=CalendarEventOut)
def update_event(
    event_id: int,
    updates: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"detail": "Event deleted"}
