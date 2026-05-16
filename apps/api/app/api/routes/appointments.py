from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Appointment, Doctor, User
from app.schemas.appointment import AppointmentCreate, AppointmentRead, AppointmentUpdate
from app.services.family_access import get_authorized_patient_ids

router = APIRouter()


@router.get("", response_model=list[AppointmentRead])
def list_appointments(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    scope: Annotated[str, Query(pattern="^(own|shared|all)$")] = "own",
) -> list[Appointment]:
    authorized_patient_ids = get_authorized_patient_ids(db, current_user.id)

    if scope == "own":
        patient_ids = {current_user.id}
    elif scope == "shared":
        patient_ids = authorized_patient_ids - {current_user.id}
    else:
        patient_ids = authorized_patient_ids

    if not patient_ids:
        return []

    appointments = list(
        db.scalars(
            select(Appointment)
            .where(Appointment.patient_user_id.in_(patient_ids))
            .order_by(Appointment.scheduled_at.asc())
        )
    )
    hydrate_display_fields(db, appointments, patient_ids)
    return appointments


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Appointment:
    if payload.doctor_id is not None:
        doctor = db.get(Doctor, payload.doctor_id)
        if doctor is None or doctor.owner_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Doctor is not available")

    appointment = Appointment(
        patient_user_id=current_user.id,
        doctor_id=payload.doctor_id,
        scheduled_at=payload.scheduled_at,
        reason=payload.reason,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    hydrate_display_fields(db, [appointment], {current_user.id})
    return appointment


@router.patch("/{appointment_id}", response_model=AppointmentRead)
def update_appointment(
    appointment_id: UUID,
    payload: AppointmentUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    if appointment.patient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own appointments")

    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("doctor_id") is not None:
        doctor = db.get(Doctor, update_data["doctor_id"])
        if doctor is None or doctor.owner_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Doctor is not available")

    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)
    hydrate_display_fields(db, [appointment], {current_user.id})
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    if appointment.patient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own appointments")

    db.delete(appointment)
    db.commit()


def hydrate_display_fields(db: Session, appointments: list[Appointment], patient_ids: set[UUID]) -> None:
    patient_names = dict(db.execute(select(User.id, User.display_name).where(User.id.in_(patient_ids))).all())
    doctor_ids = {appointment.doctor_id for appointment in appointments if appointment.doctor_id is not None}
    doctor_names = {}
    if doctor_ids:
        doctor_names = dict(db.execute(select(Doctor.id, Doctor.name).where(Doctor.id.in_(doctor_ids))).all())

    for appointment in appointments:
        appointment.patient_display_name = patient_names.get(appointment.patient_user_id, "Unknown")
        appointment.doctor_name = doctor_names.get(appointment.doctor_id) if appointment.doctor_id else None

