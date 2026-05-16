from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Medication, User
from app.schemas.medication import MedicationCreate, MedicationRead, MedicationUpdate
from app.services.family_access import get_authorized_patient_ids

router = APIRouter()


@router.get("", response_model=list[MedicationRead])
def list_medications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    scope: Annotated[str, Query(pattern="^(own|shared|all)$")] = "own",
) -> list[Medication]:
    authorized_patient_ids = get_authorized_patient_ids(db, current_user.id)

    if scope == "own":
        patient_ids = {current_user.id}
    elif scope == "shared":
        patient_ids = authorized_patient_ids - {current_user.id}
    else:
        patient_ids = authorized_patient_ids

    if not patient_ids:
        return []

    medications = list(
        db.scalars(
            select(Medication)
            .where(Medication.patient_user_id.in_(patient_ids))
            .order_by(Medication.is_active.desc(), Medication.start_date.desc(), Medication.created_at.desc())
        )
    )
    patient_names = dict(db.execute(select(User.id, User.display_name).where(User.id.in_(patient_ids))).all())
    for medication in medications:
        medication.patient_display_name = patient_names.get(medication.patient_user_id, "Unknown")
    return medications


@router.post("", response_model=MedicationRead, status_code=status.HTTP_201_CREATED)
def create_medication(
    payload: MedicationCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Medication:
    medication = Medication(
        patient_user_id=current_user.id,
        name=payload.name,
        dosage=payload.dosage,
        frequency=payload.frequency,
        meal_timing=payload.meal_timing,
        route=payload.route,
        start_date=payload.start_date,
        end_date=payload.end_date,
        refill_quantity=payload.refill_quantity,
        remaining_quantity=payload.remaining_quantity,
        instructions=payload.instructions,
        is_active=True,
    )
    db.add(medication)
    db.commit()
    db.refresh(medication)
    medication.patient_display_name = current_user.display_name
    return medication


@router.patch("/{medication_id}", response_model=MedicationRead)
def update_medication(
    medication_id: UUID,
    payload: MedicationUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Medication:
    medication = db.get(Medication, medication_id)
    if medication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    if medication.patient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own medications")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(medication, field, value)

    db.commit()
    db.refresh(medication)
    medication.patient_display_name = current_user.display_name
    return medication


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(
    medication_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    medication = db.get(Medication, medication_id)
    if medication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")

    if medication.patient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own medications")

    db.delete(medication)
    db.commit()
