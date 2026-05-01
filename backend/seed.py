"""Populate the database with realistic demo data."""
import datetime
from app.database import SessionLocal, engine, Base
from app.models import (
    User, UserRole, Property, PropertyStatus, Lease, LeaseStatus,
    Payment, PaymentStatus, MaintenanceRequest, MaintenanceStatus, MaintenancePriority,
    Notification, NotificationType, Message, CalendarEvent,
)
from app.auth import get_password_hash

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Users ──
admin = User(email="admin@propertyhub.com", hashed_password=get_password_hash("admin123"),
             full_name="Sarah Johnson", phone="555-0100", role=UserRole.ADMIN)
manager = User(email="manager@propertyhub.com", hashed_password=get_password_hash("manager123"),
               full_name="Michael Chen", phone="555-0101", role=UserRole.MANAGER)
tenants_data = [
    ("james.wilson@email.com", "James Wilson", "555-0201"),
    ("emily.davis@email.com", "Emily Davis", "555-0202"),
    ("robert.martinez@email.com", "Robert Martinez", "555-0203"),
    ("olivia.taylor@email.com", "Olivia Taylor", "555-0204"),
    ("william.anderson@email.com", "William Anderson", "555-0205"),
    ("sophia.thomas@email.com", "Sophia Thomas", "555-0206"),
]
tenants = []
for email, name, phone in tenants_data:
    t = User(email=email, hashed_password=get_password_hash("tenant123"),
             full_name=name, phone=phone, role=UserRole.TENANT)
    tenants.append(t)

db.add_all([admin, manager] + tenants)
db.commit()

# ── Properties ──
props_data = [
    ("Sunset Apartments #101", "123 Sunset Blvd", "Los Angeles", "CA", "90001", "apartment", 2, 1, 850, 1800),
    ("Sunset Apartments #202", "123 Sunset Blvd", "Los Angeles", "CA", "90001", "apartment", 3, 2, 1200, 2400),
    ("Maple Street House", "456 Maple St", "Portland", "OR", "97201", "house", 4, 3, 2200, 3200),
    ("Downtown Loft", "789 Main Ave", "Seattle", "WA", "98101", "condo", 1, 1, 650, 1500),
    ("Riverside Cottage", "321 River Rd", "Austin", "TX", "73301", "house", 3, 2, 1600, 2100),
    ("Pine View Studio", "555 Pine Dr", "Denver", "CO", "80201", "studio", 0, 1, 400, 950),
    ("Harbor Point #305", "100 Harbor Way", "San Diego", "CA", "92101", "apartment", 2, 2, 1000, 2200),
    ("Elm Terrace", "222 Elm St", "Phoenix", "AZ", "85001", "townhouse", 3, 2.5, 1800, 2600),
]
properties = []
for name, addr, city, state, zip_c, ptype, bed, bath, sqft, rent in props_data:
    p = Property(name=name, address=addr, city=city, state=state, zip_code=zip_c,
                 property_type=ptype, bedrooms=bed, bathrooms=bath, square_feet=sqft,
                 rent_amount=rent, manager_id=manager.id,
                 description=f"Beautiful {ptype} in {city}. Well-maintained with modern amenities.",
                 amenities="Parking, Laundry, AC, Heating")
    properties.append(p)

db.add_all(properties)
db.commit()

# ── Leases ──
today = datetime.date.today()
leases = [
    Lease(property_id=properties[0].id, tenant_id=tenants[0].id,
          start_date=today - datetime.timedelta(days=180), end_date=today + datetime.timedelta(days=185),
          rent_amount=1800, security_deposit=3600, status=LeaseStatus.ACTIVE),
    Lease(property_id=properties[1].id, tenant_id=tenants[1].id,
          start_date=today - datetime.timedelta(days=90), end_date=today + datetime.timedelta(days=275),
          rent_amount=2400, security_deposit=4800, status=LeaseStatus.ACTIVE),
    Lease(property_id=properties[2].id, tenant_id=tenants[2].id,
          start_date=today - datetime.timedelta(days=300), end_date=today + datetime.timedelta(days=65),
          rent_amount=3200, security_deposit=6400, status=LeaseStatus.ACTIVE),
    Lease(property_id=properties[3].id, tenant_id=tenants[3].id,
          start_date=today - datetime.timedelta(days=45), end_date=today + datetime.timedelta(days=320),
          rent_amount=1500, security_deposit=3000, status=LeaseStatus.ACTIVE),
    Lease(property_id=properties[4].id, tenant_id=tenants[4].id,
          start_date=today - datetime.timedelta(days=365), end_date=today + datetime.timedelta(days=25),
          rent_amount=2100, security_deposit=4200, status=LeaseStatus.PENDING_RENEWAL),
    Lease(property_id=properties[6].id, tenant_id=tenants[5].id,
          start_date=today - datetime.timedelta(days=120), end_date=today + datetime.timedelta(days=245),
          rent_amount=2200, security_deposit=4400, status=LeaseStatus.ACTIVE),
]

for i, prop in enumerate(properties[:6]):
    if i != 5:
        prop.status = PropertyStatus.OCCUPIED
properties[5].status = PropertyStatus.AVAILABLE
properties[6].status = PropertyStatus.OCCUPIED
properties[7].status = PropertyStatus.MAINTENANCE

db.add_all(leases)
db.commit()

# ── Payments ──
payments = []
for lease in leases:
    for m in range(3):
        due = today - datetime.timedelta(days=30 * (2 - m))
        status = PaymentStatus.PAID if m < 2 else PaymentStatus.PENDING
        p = Payment(
            lease_id=lease.id, tenant_id=lease.tenant_id, amount=lease.rent_amount,
            due_date=due, status=status,
            payment_date=datetime.datetime.combine(due, datetime.time()) if status == PaymentStatus.PAID else None,
            payment_method="credit_card" if status == PaymentStatus.PAID else None,
            transaction_id=f"TXN-{lease.id}{m}00{m}" if status == PaymentStatus.PAID else None,
        )
        payments.append(p)

overdue = Payment(
    lease_id=leases[4].id, tenant_id=leases[4].tenant_id, amount=2100,
    due_date=today - datetime.timedelta(days=15), status=PaymentStatus.OVERDUE,
)
payments.append(overdue)
db.add_all(payments)
db.commit()

# ── Maintenance Requests ──
maint_requests = [
    MaintenanceRequest(property_id=properties[0].id, requested_by=tenants[0].id,
                       title="Leaky Faucet", description="Kitchen faucet is dripping constantly",
                       priority=MaintenancePriority.MEDIUM, status=MaintenanceStatus.OPEN),
    MaintenanceRequest(property_id=properties[2].id, requested_by=tenants[2].id,
                       title="Broken Window", description="Living room window won't close properly",
                       priority=MaintenancePriority.HIGH, status=MaintenanceStatus.IN_PROGRESS,
                       scheduled_date=datetime.datetime.now() + datetime.timedelta(days=2)),
    MaintenanceRequest(property_id=properties[7].id, requested_by=admin.id,
                       title="Full Renovation", description="Complete bathroom renovation needed",
                       priority=MaintenancePriority.LOW, status=MaintenanceStatus.IN_PROGRESS,
                       cost=8500),
    MaintenanceRequest(property_id=properties[1].id, requested_by=tenants[1].id,
                       title="AC Not Working", description="Air conditioning stopped working",
                       priority=MaintenancePriority.URGENT, status=MaintenanceStatus.OPEN),
]
db.add_all(maint_requests)

# ── Notifications ──
notifs = [
    Notification(user_id=tenants[0].id, title="Rent Due Soon",
                 message="Your rent of $1,800 is due in 5 days.",
                 notification_type=NotificationType.RENT_DUE, is_urgent=False),
    Notification(user_id=tenants[4].id, title="Lease Expiring",
                 message="Your lease expires in 25 days. Please contact management about renewal.",
                 notification_type=NotificationType.LEASE_EXPIRING, is_urgent=True),
    Notification(user_id=tenants[2].id, title="Maintenance Scheduled",
                 message="Window repair has been scheduled for next week.",
                 notification_type=NotificationType.MAINTENANCE_UPDATE),
    Notification(user_id=admin.id, title="Overdue Payment Alert",
                 message="William Anderson has an overdue payment of $2,100.",
                 notification_type=NotificationType.RENT_DUE, is_urgent=True),
]
db.add_all(notifs)

# ── Messages ──
msgs = [
    Message(sender_id=tenants[0].id, recipient_id=manager.id,
            subject="Faucet Issue", body="Hi, my kitchen faucet has been leaking for a few days. Could someone come fix it?"),
    Message(sender_id=manager.id, recipient_id=tenants[0].id,
            subject="Re: Faucet Issue", body="Hi James, we've logged your request. A plumber will be there Thursday."),
    Message(sender_id=tenants[4].id, recipient_id=admin.id,
            subject="Lease Renewal", body="I'd like to discuss renewing my lease. Can we schedule a meeting?"),
]
db.add_all(msgs)

# ── Calendar Events ──
events = [
    CalendarEvent(title="Property Showing - Pine View Studio", event_type="showing",
                  property_id=properties[5].id,
                  start_time=datetime.datetime.now() + datetime.timedelta(days=3, hours=10),
                  end_time=datetime.datetime.now() + datetime.timedelta(days=3, hours=11),
                  created_by=manager.id),
    CalendarEvent(title="Window Repair - Maple Street House", event_type="maintenance",
                  property_id=properties[2].id,
                  start_time=datetime.datetime.now() + datetime.timedelta(days=2, hours=9),
                  end_time=datetime.datetime.now() + datetime.timedelta(days=2, hours=12),
                  created_by=manager.id),
    CalendarEvent(title="Lease Renewal Meeting - W. Anderson", event_type="meeting",
                  property_id=properties[4].id,
                  start_time=datetime.datetime.now() + datetime.timedelta(days=5, hours=14),
                  end_time=datetime.datetime.now() + datetime.timedelta(days=5, hours=15),
                  created_by=admin.id),
    CalendarEvent(title="Quarterly Property Inspection", event_type="inspection",
                  start_time=datetime.datetime.now() + datetime.timedelta(days=14, hours=8),
                  end_time=datetime.datetime.now() + datetime.timedelta(days=14, hours=17),
                  all_day=True, created_by=admin.id),
]
db.add_all(events)
db.commit()
db.close()

print("Database seeded successfully!")
print(f"Admin: admin@propertyhub.com / admin123")
print(f"Manager: manager@propertyhub.com / manager123")
print(f"Tenant: james.wilson@email.com / tenant123")
