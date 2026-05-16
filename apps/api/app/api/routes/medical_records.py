from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import MedicalRecord, User
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordRead, MedicalRecordUpdate
from app.services.family_access import get_authorized_patient_ids

router = APIRouter()


@router.get("", response_model=list[MedicalRecordRead])
def list_medical_records(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    scope: Annotated[str, Query(pattern="^(own|shared|all)$")] = "own",
) -> list[MedicalRecord]:
    authorized_patient_ids = get_authorized_patient_ids(db, current_user.id)

    if scope == "own":
        patient_ids = {current_user.id}
    elif scope == "shared":
        patient_ids = authorized_patient_ids - {current_user.id}
    else:
        patient_ids = authorized_patient_ids

    if not patient_ids:
        return []

    records = list(
        db.scalars(
            select(MedicalRecord)
            .where(MedicalRecord.patient_user_id.in_(patient_ids))
            .order_by(MedicalRecord.record_date.desc(), MedicalRecord.created_at.desc())
        )
    )
    patient_names = dict(db.execute(select(User.id, User.display_name).where(User.id.in_(patient_ids))).all())
    for record in records:
        record.patient_display_name = patient_names.get(record.patient_user_id, "Unknown")
    return records


@router.post("", response_model=MedicalRecordRead, status_code=status.HTTP_201_CREATED)
def create_medical_record(
    payload: MedicalRecordCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MedicalRecord:
    record = MedicalRecord(
        patient_user_id=current_user.id,
        doctor_id=payload.doctor_id,
        record_type=payload.record_type,
        title=payload.title,
        description=payload.description,
        record_date=payload.record_date,
        created_by_user_id=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    record.patient_display_name = current_user.display_name
    return record


@router.patch("/{record_id}", response_model=MedicalRecordRead)
def update_medical_record(
    record_id: UUID,
    payload: MedicalRecordUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MedicalRecord:
    record = db.get(MedicalRecord, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    if record.patient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own records")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    record.patient_display_name = current_user.display_name
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medical_record(
    record_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    record = db.get(MedicalRecord, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    if record.patient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own records")

    db.delete(record)
    db.commit()
