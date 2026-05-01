# PropertyHub — Property Management System

A comprehensive web application for managing house rental properties. Track payments, manage tenants, schedule maintenance, and generate financial reports — all in one place.

## Features

- **Property Management** — List, search, and manage rental properties with detailed information
- **Tenant Management** — Full tenant directory with search by name, email, or phone
- **Lease Management** — Create, track, and renew leases with automated status tracking
- **Rent Payment Tracking** — Online payment processing with payment history and receipts
- **Admin Dashboard** — KPI overview with real-time metrics on revenue, occupancy, and maintenance
- **Financial Reporting** — Monthly revenue charts, payment breakdowns, and financial summaries
- **Occupancy Reports** — Vacancy and occupancy rate analysis with visual charts
- **Notification System** — Alerts for rent due dates, lease expirations, maintenance updates, and urgent notifications
- **Tenant Communication Portal** — Built-in messaging system between tenants and management
- **Calendar View** — Schedule property showings, maintenance appointments, and inspections
- **Document Management** — Upload and organize leases, contracts, and property-related files
- **Maintenance Tracking** — Submit, track, and manage maintenance requests with priority levels
- **Role-Based Access Control** — Admin, Manager, and Tenant roles with permission-based access
- **Secure Authentication** — JWT-based login system with password hashing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | SQLite (swappable to PostgreSQL) |
| Auth | JWT (python-jose), bcrypt password hashing |
| Charts | Recharts |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python seed.py          # Populate with demo data
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:5173
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@propertyhub.com | admin123 |
| Manager | manager@propertyhub.com | manager123 |
| Tenant | james.wilson@email.com | tenant123 |

## Project Structure

```
property-management/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # Authentication & RBAC
│   │   ├── database.py      # Database configuration
│   │   ├── config.py        # App settings
│   │   └── routers/         # API route handlers
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── properties.py
│   │       ├── leases.py
│   │       ├── payments.py
│   │       ├── maintenance.py
│   │       ├── notifications.py
│   │       ├── messages.py
│   │       ├── documents.py
│   │       ├── calendar.py
│   │       └── reports.py
│   ├── seed.py              # Demo data seeder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── context/         # Auth context
│   │   ├── components/      # Layout & shared components
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript types
│   │   └── lib/             # API client
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| Users | `GET/PUT/DELETE /api/users/` |
| Properties | `GET/POST/PUT/DELETE /api/properties/` |
| Leases | `GET/POST/PUT /api/leases/`, `POST /api/leases/{id}/renew` |
| Payments | `GET/POST /api/payments/`, `POST /api/payments/{id}/process` |
| Maintenance | `GET/POST/PUT /api/maintenance/` |
| Notifications | `GET/POST /api/notifications/`, `PUT /read-all` |
| Messages | `GET/POST /api/messages/` |
| Documents | `GET/POST/DELETE /api/documents/` |
| Calendar | `GET/POST/PUT/DELETE /api/calendar/` |
| Reports | `GET /api/reports/financial`, `GET /api/reports/occupancy`, `GET /api/reports/dashboard` |
