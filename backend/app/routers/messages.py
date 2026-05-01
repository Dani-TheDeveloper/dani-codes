from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Message, User
from app.schemas import MessageCreate, MessageOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["Messages"])


@router.get("/", response_model=List[MessageOut])
def list_messages(
    folder: str = "inbox",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if folder == "sent":
        q = db.query(Message).filter(Message.sender_id == current_user.id)
    else:
        q = db.query(Message).filter(Message.recipient_id == current_user.id)
    return q.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=MessageOut, status_code=201)
def send_message(
    msg: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = Message(
        sender_id=current_user.id,
        recipient_id=msg.recipient_id,
        subject=msg.subject,
        body=msg.body,
        parent_id=msg.parent_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/{message_id}", response_model=MessageOut)
def get_message(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id and msg.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if msg.recipient_id == current_user.id and not msg.is_read:
        msg.is_read = True
        db.commit()
    return msg


@router.put("/{message_id}/read")
def mark_message_read(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(Message).filter(
        Message.id == message_id, Message.recipient_id == current_user.id
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    return {"detail": "Marked as read"}
