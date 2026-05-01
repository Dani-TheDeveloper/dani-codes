from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ── Auth ──
class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ── User ──
class UserBase(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str = "tenant"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


# ── Property ──
class PropertyBase(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    property_type: str
    bedrooms: int = 0
    bathrooms: float = 0
    square_feet: Optional[int] = None
    rent_amount: float
    description: Optional[str] = None
    amenities: Optional[str] = None
    image_url: Optional[str] = None


class PropertyCreate(PropertyBase):
    manager_id: Optional[int] = None


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    rent_amount: Optional[float] = None
    status: Optional[str] = None
    description: Optional[str] = None
    amenities: Optional[str] = None
    image_url: Optional[str] = None
    manager_id: Optional[int] = None


class PropertyOut(PropertyBase):
    id: int
    status: str
    manager_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Lease ──
class LeaseBase(BaseModel):
    property_id: int
    tenant_id: int
    start_date: date
    end_date: date
    rent_amount: float
    security_deposit: float = 0
    terms: Optional[str] = None


class LeaseCreate(LeaseBase):
    pass


class LeaseUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    rent_amount: Optional[float] = None
    security_deposit: Optional[float] = None
    status: Optional[str] = None
    terms: Optional[str] = None


class LeaseOut(LeaseBase):
    id: int
    status: str
    created_at: datetime
    tenant: Optional[UserOut] = None
    property: Optional[PropertyOut] = None

    class Config:
        from_attributes = True


# ── Payment ──
class PaymentBase(BaseModel):
    lease_id: int
    tenant_id: int
    amount: float
    due_date: date
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentProcess(BaseModel):
    payment_method: str
    transaction_id: Optional[str] = None


class PaymentOut(PaymentBase):
    id: int
    payment_date: Optional[datetime] = None
    status: str
    transaction_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Maintenance ──
class MaintenanceBase(BaseModel):
    property_id: int
    title: str
    description: str
    priority: str = "medium"


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    cost: Optional[float] = None
    notes: Optional[str] = None


class MaintenanceOut(MaintenanceBase):
    id: int
    requested_by: int
    status: str
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    cost: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Notification ──
class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    is_urgent: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: str = "general"
    is_urgent: bool = False


# ── Message ──
class MessageCreate(BaseModel):
    recipient_id: int
    subject: str
    body: str
    parent_id: Optional[int] = None


class MessageOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    subject: str
    body: str
    is_read: bool
    parent_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Document ──
class DocumentOut(BaseModel):
    id: int
    name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    property_id: Optional[int] = None
    uploaded_by: int
    category: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Calendar ──
class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str
    property_id: Optional[int] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    all_day: bool = False


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    property_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None


class CalendarEventOut(CalendarEventBase):
    id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Reports ──
class FinancialReport(BaseModel):
    total_revenue: float
    total_pending: float
    total_overdue: float
    monthly_revenue: List[dict]
    payment_breakdown: dict


class OccupancyReport(BaseModel):
    total_properties: int
    occupied: int
    available: int
    maintenance: int
    occupancy_rate: float
    vacancy_rate: float


class DashboardKPIs(BaseModel):
    total_properties: int
    total_tenants: int
    total_revenue: float
    pending_payments: float
    overdue_payments: float
    occupancy_rate: float
    active_leases: int
    expiring_leases: int
    open_maintenance: int
    unread_notifications: int
