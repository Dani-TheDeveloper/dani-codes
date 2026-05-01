from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models import (
    Property, PropertyStatus, User, UserRole, Lease, LeaseStatus,
    Payment, PaymentStatus, MaintenanceRequest, MaintenanceStatus, Notification,
)
from app.schemas import FinancialReport, OccupancyReport, DashboardKPIs
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/financial", response_model=FinancialReport)
def financial_report(
    year: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    if year is None:
        year = date.today().year

    paid = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == PaymentStatus.PAID,
        extract("year", Payment.payment_date) == year,
    ).scalar()

    pending = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == PaymentStatus.PENDING
    ).scalar()

    overdue = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == PaymentStatus.OVERDUE
    ).scalar()

    monthly = []
    for month in range(1, 13):
        rev = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
            Payment.status == PaymentStatus.PAID,
            extract("year", Payment.payment_date) == year,
            extract("month", Payment.payment_date) == month,
        ).scalar()
        monthly.append({"month": month, "revenue": float(rev)})

    methods = db.query(Payment.payment_method, func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatus.PAID,
    ).group_by(Payment.payment_method).all()
    breakdown = {m or "unknown": float(a) for m, a in methods}

    return FinancialReport(
        total_revenue=float(paid),
        total_pending=float(pending),
        total_overdue=float(overdue),
        monthly_revenue=monthly,
        payment_breakdown=breakdown,
    )


@router.get("/occupancy", response_model=OccupancyReport)
def occupancy_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    total = db.query(func.count(Property.id)).scalar()
    occupied = db.query(func.count(Property.id)).filter(Property.status == PropertyStatus.OCCUPIED).scalar()
    available = db.query(func.count(Property.id)).filter(Property.status == PropertyStatus.AVAILABLE).scalar()
    maint = db.query(func.count(Property.id)).filter(Property.status == PropertyStatus.MAINTENANCE).scalar()

    occ_rate = (occupied / total * 100) if total > 0 else 0
    vac_rate = (available / total * 100) if total > 0 else 0

    return OccupancyReport(
        total_properties=total,
        occupied=occupied,
        available=available,
        maintenance=maint,
        occupancy_rate=round(occ_rate, 1),
        vacancy_rate=round(vac_rate, 1),
    )


@router.get("/dashboard", response_model=DashboardKPIs)
def dashboard_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_props = db.query(func.count(Property.id)).scalar()
    total_tenants = db.query(func.count(User.id)).filter(User.role == UserRole.TENANT).scalar()

    total_rev = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == PaymentStatus.PAID
    ).scalar()
    pending_pay = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == PaymentStatus.PENDING
    ).scalar()
    overdue_pay = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == PaymentStatus.OVERDUE
    ).scalar()

    occupied = db.query(func.count(Property.id)).filter(Property.status == PropertyStatus.OCCUPIED).scalar()
    occ_rate = (occupied / total_props * 100) if total_props > 0 else 0

    active_leases = db.query(func.count(Lease.id)).filter(Lease.status == LeaseStatus.ACTIVE).scalar()

    thirty_days = date.today() + timedelta(days=30)
    expiring = db.query(func.count(Lease.id)).filter(
        Lease.status == LeaseStatus.ACTIVE,
        Lease.end_date <= thirty_days,
    ).scalar()

    open_maint = db.query(func.count(MaintenanceRequest.id)).filter(
        MaintenanceRequest.status.in_([MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS])
    ).scalar()

    unread = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).scalar()

    return DashboardKPIs(
        total_properties=total_props,
        total_tenants=total_tenants,
        total_revenue=float(total_rev),
        pending_payments=float(pending_pay),
        overdue_payments=float(overdue_pay),
        occupancy_rate=round(occ_rate, 1),
        active_leases=active_leases,
        expiring_leases=expiring,
        open_maintenance=open_maint,
        unread_notifications=unread,
    )
