from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import HealthMeasurement, User
from app.schemas.health_measurement import HealthMeasurementCreate, HealthMeasurementRead
from app.services.family_access import get_authorized_patient_ids

router = APIRouter()


@router.get("/measurements", response_model=list[HealthMeasurementRead])
def list_measurements(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    scope: Annotated[str, Query(pattern="^(own|shared|all)$")] = "own",
    measurement_type: str | None = None,
) -> list[HealthMeasurement]:
    authorized_patient_ids = get_authorized_patient_ids(db, current_user.id)

    if scope == "own":
        patient_ids = {current_user.id}
    elif scope == "shared":
        patient_ids = authorized_patient_ids - {current_user.id}
    else:
        patient_ids = authorized_patient_ids

    if not patient_ids:
        return []

    query = select(HealthMeasurement).where(HealthMeasurement.patient_user_id.in_(patient_ids))
    if measurement_type:
        query = query.where(HealthMeasurement.measurement_type == measurement_type)

    measurements = list(db.scalars(query.order_by(HealthMeasurement.measured_at.desc())))
    hydrate_patient_names(db, measurements, patient_ids)
    return measurements


@router.post("/measurements", response_model=HealthMeasurementRead, status_code=status.HTTP_201_CREATED)
def create_measurement(
    payload: HealthMeasurementCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> HealthMeasurement:
    measurement = HealthMeasurement(
        patient_user_id=current_user.id,
        measurement_type=payload.measurement_type,
        value=payload.value,
        unit=payload.unit,
        measured_at=payload.measured_at,
        notes=payload.notes,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    measurement.patient_display_name = current_user.display_name
    return measurement


@router.delete("/measurements/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_measurement(
    measurement_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    measurement = db.get(HealthMeasurement, measurement_id)
    if measurement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found")

    if measurement.patient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own measurements")

    db.delete(measurement)
    db.commit()


def hydrate_patient_names(db: Session, measurements: list[HealthMeasurement], patient_ids: set[UUID]) -> None:
    patient_names = dict(db.execute(select(User.id, User.display_name).where(User.id.in_(patient_ids))).all())
    for measurement in measurements:
        measurement.patient_display_name = patient_names.get(measurement.patient_user_id, "Unknown")

