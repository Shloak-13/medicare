from hashlib import sha256
from pathlib import Path
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models import FileUpload, MedicalRecord, User
from app.schemas.file_upload import FileUploadRead
from app.services.family_access import get_authorized_patient_ids

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}


@router.get("", response_model=list[FileUploadRead])
def list_files(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    scope: Annotated[str, Query(pattern="^(own|shared|all)$")] = "own",
) -> list[FileUpload]:
    authorized_patient_ids = get_authorized_patient_ids(db, current_user.id)

    if scope == "own":
        patient_ids = {current_user.id}
    elif scope == "shared":
        patient_ids = authorized_patient_ids - {current_user.id}
    else:
        patient_ids = authorized_patient_ids

    if not patient_ids:
        return []

    files = list(
        db.scalars(
            select(FileUpload)
            .where(FileUpload.patient_user_id.in_(patient_ids))
            .order_by(FileUpload.created_at.desc())
        )
    )
    hydrate_patient_names(db, files, patient_ids)
    return files


@router.post("", response_model=FileUploadRead, status_code=status.HTTP_201_CREATED)
async def upload_file(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    upload: UploadFile = File(...),
    medical_record_id: UUID | None = None,
) -> FileUpload:
    if upload.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, JPG, PNG, and WEBP files are allowed",
        )

    if medical_record_id is not None:
        record = db.get(MedicalRecord, medical_record_id)
        if record is None or record.patient_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Medical record is not available")

    content = await upload.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty")

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is too large")

    extension = Path(upload.filename or "upload").suffix.lower()
    storage_name = f"{current_user.id}/{uuid4()}{extension}"
    upload_root = Path(settings.upload_dir)
    destination = upload_root / storage_name
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)

    file_row = FileUpload(
        patient_user_id=current_user.id,
        medical_record_id=medical_record_id,
        uploaded_by_user_id=current_user.id,
        original_filename=upload.filename or "upload",
        storage_provider="local",
        storage_key=storage_name,
        mime_type=upload.content_type or "application/octet-stream",
        byte_size=len(content),
        checksum_sha256=sha256(content).hexdigest(),
    )
    db.add(file_row)
    db.commit()
    db.refresh(file_row)
    file_row.patient_display_name = current_user.display_name
    return file_row


@router.get("/{file_id}/download")
def download_file(
    file_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FileResponse:
    file_row = db.get(FileUpload, file_id)
    if file_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    authorized_patient_ids = get_authorized_patient_ids(db, current_user.id)
    if file_row.patient_user_id not in authorized_patient_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot access this file")

    path = Path(settings.upload_dir) / file_row.storage_key
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file is missing")

    return FileResponse(path, media_type=file_row.mime_type, filename=file_row.original_filename)


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    file_row = db.get(FileUpload, file_id)
    if file_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    if file_row.patient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own files")

    path = Path(settings.upload_dir) / file_row.storage_key
    if path.exists():
        path.unlink()

    db.delete(file_row)
    db.commit()


def hydrate_patient_names(db: Session, files: list[FileUpload], patient_ids: set[UUID]) -> None:
    patient_names = dict(db.execute(select(User.id, User.display_name).where(User.id.in_(patient_ids))).all())
    for file_row in files:
        file_row.patient_display_name = patient_names.get(file_row.patient_user_id, "Unknown")

