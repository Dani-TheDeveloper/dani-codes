import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum, Date
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    TENANT = "tenant"


class PropertyStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    PARTIAL = "partial"


class LeaseStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"
    PENDING_RENEWAL = "pending_renewal"


class MaintenanceStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MaintenancePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationType(str, enum.Enum):
    RENT_DUE = "rent_due"
    LEASE_EXPIRING = "lease_expiring"
    MAINTENANCE_UPDATE = "maintenance_update"
    PAYMENT_RECEIVED = "payment_received"
    GENERAL = "general"
    LEASE_RENEWAL = "lease_renewal"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(SAEnum(UserRole), default=UserRole.TENANT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    avatar_url = Column(String, nullable=True)

    properties_managed = relationship("Property", back_populates="manager")
    leases = relationship("Lease", back_populates="tenant")
    payments = relationship("Payment", back_populates="tenant")
    notifications = relationship("Notification", back_populates="user")
    messages_sent = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    documents = relationship("Document", back_populates="uploaded_by_user")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="requested_by_user")


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    property_type = Column(String, nullable=False)
    bedrooms = Column(Integer, default=0)
    bathrooms = Column(Float, default=0)
    square_feet = Column(Integer, nullable=True)
    rent_amount = Column(Float, nullable=False)
    status = Column(SAEnum(PropertyStatus), default=PropertyStatus.AVAILABLE)
    description = Column(Text, nullable=True)
    amenities = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    manager = relationship("User", back_populates="properties_managed")
    leases = relationship("Lease", back_populates="property")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="property")
    documents = relationship("Document", back_populates="property")
    calendar_events = relationship("CalendarEvent", back_populates="property")


class Lease(Base):
    __tablename__ = "leases"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    rent_amount = Column(Float, nullable=False)
    security_deposit = Column(Float, default=0)
    status = Column(SAEnum(LeaseStatus), default=LeaseStatus.ACTIVE)
    terms = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    property = relationship("Property", back_populates="leases")
    tenant = relationship("User", back_populates="leases")
    payments = relationship("Payment", back_populates="lease")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    lease_id = Column(Integer, ForeignKey("leases.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, nullable=True)
    due_date = Column(Date, nullable=False)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_method = Column(String, nullable=True)
    transaction_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lease = relationship("Lease", back_populates="payments")
    tenant = relationship("User", back_populates="payments")


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(SAEnum(MaintenancePriority), default=MaintenancePriority.MEDIUM)
    status = Column(SAEnum(MaintenanceStatus), default=MaintenanceStatus.OPEN)
    scheduled_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    cost = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    property = relationship("Property", back_populates="maintenance_requests")
    requested_by_user = relationship("User", back_populates="maintenance_requests")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(SAEnum(NotificationType), default=NotificationType.GENERAL)
    is_read = Column(Boolean, default=False)
    is_urgent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    parent_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", back_populates="messages_sent")
    replies = relationship("Message", backref="parent", remote_side=[id])


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    property = relationship("Property", back_populates="documents")
    uploaded_by_user = relationship("User", back_populates="documents")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String, nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    all_day = Column(Boolean, default=False)
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    property = relationship("Property", back_populates="calendar_events")
