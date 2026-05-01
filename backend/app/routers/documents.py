import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Document, User, UserRole
from app.schemas import DocumentOut
from app.auth import get_current_user, require_role

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.get("/", response_model=List[DocumentOut])
def list_documents(
    property_id: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Document)
    if current_user.role == UserRole.TENANT:
        q = q.filter(Document.uploaded_by == current_user.id)
    if property_id:
        q = q.filter(Document.property_id == property_id)
    if category:
        q = q.filter(Document.category == category)
    if search:
        q = q.filter(Document.name.ilike(f"%{search}%"))
    return q.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    property_id: Optional[int] = Form(None),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    doc = Document(
        name=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=os.path.getsize(file_path),
        property_id=property_id,
        uploaded_by=current_user.id,
        category=category,
        description=description,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role == UserRole.TENANT and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted"}
