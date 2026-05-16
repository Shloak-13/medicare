from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Doctor, User
from app.schemas.doctor import DoctorCreate, DoctorRead, DoctorUpdate
from app.services.family_access import get_authorized_patient_ids

router = APIRouter()


@router.get("", response_model=list[DoctorRead])
def list_doctors(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    scope: Annotated[str, Query(pattern="^(own|shared|all)$")] = "own",
) -> list[Doctor]:
    authorized_user_ids = get_authorized_patient_ids(db, current_user.id)

    if scope == "own":
        owner_ids = {current_user.id}
    elif scope == "shared":
        owner_ids = authorized_user_ids - {current_user.id}
    else:
        owner_ids = authorized_user_ids

    if not owner_ids:
        return []

    doctors = list(
        db.scalars(
            select(Doctor)
            .where(Doctor.owner_user_id.in_(owner_ids))
            .order_by(Doctor.specialty.asc(), Doctor.name.asc())
        )
    )
    owner_names = dict(db.execute(select(User.id, User.display_name).where(User.id.in_(owner_ids))).all())
    for doctor in doctors:
        doctor.owner_display_name = owner_names.get(doctor.owner_user_id, "Unknown")
    return doctors


@router.post("", response_model=DoctorRead, status_code=status.HTTP_201_CREATED)
def create_doctor(
    payload: DoctorCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Doctor:
    doctor = Doctor(
        owner_user_id=current_user.id,
        name=payload.name,
        specialty=payload.specialty,
        clinic_name=payload.clinic_name,
        phone=payload.phone,
        email=str(payload.email) if payload.email else None,
        address=payload.address,
        notes=payload.notes,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    doctor.owner_display_name = current_user.display_name
    return doctor


@router.patch("/{doctor_id}", response_model=DoctorRead)
def update_doctor(
    doctor_id: UUID,
    payload: DoctorUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Doctor:
    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    if doctor.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own doctors")

    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] is not None:
        update_data["email"] = str(update_data["email"])

    for field, value in update_data.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)
    doctor.owner_display_name = current_user.display_name
    return doctor


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(
    doctor_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    if doctor.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own doctors")

    db.delete(doctor)
    db.commit()
