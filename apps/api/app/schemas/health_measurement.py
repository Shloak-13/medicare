from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class HealthMeasurementCreate(BaseModel):
    measurement_type: str = Field(min_length=2, max_length=80)
    value: Decimal
    unit: str = Field(min_length=1, max_length=40)
    measured_at: datetime
    notes: str | None = Field(default=None, max_length=1000)


class HealthMeasurementRead(BaseModel):
    id: UUID
    patient_user_id: UUID
    patient_display_name: str
    measurement_type: str
    value: Decimal
    unit: str
    measured_at: datetime
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

