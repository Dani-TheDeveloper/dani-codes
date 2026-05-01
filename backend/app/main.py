from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.database import engine, Base
from app.routers import auth, users, properties, leases, payments, maintenance, notifications, messages, documents, calendar, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PropertyHub", version="1.0.0", description="Property Management System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/documents", exist_ok=True)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(properties.router)
app.include_router(leases.router)
app.include_router(payments.router)
app.include_router(maintenance.router)
app.include_router(notifications.router)
app.include_router(messages.router)
app.include_router(documents.router)
app.include_router(calendar.router)
app.include_router(reports.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
