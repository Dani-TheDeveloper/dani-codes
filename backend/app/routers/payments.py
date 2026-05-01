import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Payment, PaymentStatus, User, UserRole, Notification, NotificationType
from app.schemas import PaymentCreate, PaymentOut, PaymentProcess
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.get("/", response_model=List[PaymentOut])
def list_payments(
    status: Optional[str] = None,
    tenant_id: Optional[int] = None,
    lease_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Payment)
    if current_user.role == UserRole.TENANT:
        q = q.filter(Payment.tenant_id == current_user.id)
    if status:
        q = q.filter(Payment.status == status)
    if tenant_id:
        q = q.filter(Payment.tenant_id == tenant_id)
    if lease_id:
        q = q.filter(Payment.lease_id == lease_id)
    return q.order_by(Payment.due_date.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=PaymentOut, status_code=201)
def create_payment(
    pay_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    payment = Payment(**pay_in.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/{payment_id}/process", response_model=PaymentOut)
def process_payment(
    payment_id: int,
    process: PaymentProcess,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if current_user.role == UserRole.TENANT and payment.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    payment.status = PaymentStatus.PAID
    payment.payment_date = datetime.datetime.utcnow()
    payment.payment_method = process.payment_method
    payment.transaction_id = process.transaction_id or f"TXN-{uuid.uuid4().hex[:12].upper()}"
    db.commit()

    notification = Notification(
        user_id=payment.tenant_id,
        title="Payment Confirmed",
        message=f"Payment of ${payment.amount:.2f} has been processed successfully.",
        notification_type=NotificationType.PAYMENT_RECEIVED,
    )
    db.add(notification)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(payment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if current_user.role == UserRole.TENANT and payment.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return payment
