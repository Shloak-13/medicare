from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MedicationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    dosage: str = Field(min_length=1, max_length=100)
    frequency: str = Field(min_length=2, max_length=120)
    meal_timing: str | None = Field(default=None, max_length=80)
    route: str | None = Field(default=None, max_length=80)
    start_date: date
    end_date: date | None = None
    refill_quantity: int | None = Field(default=None, ge=0)
    remaining_quantity: int | None = Field(default=None, ge=0)
    instructions: str | None = Field(default=None, max_length=2000)


class MedicationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    dosage: str | None = Field(default=None, min_length=1, max_length=100)
    frequency: str | None = Field(default=None, min_length=2, max_length=120)
    meal_timing: str | None = Field(default=None, max_length=80)
    route: str | None = Field(default=None, max_length=80)
    start_date: date | None = None
    end_date: date | None = None
    refill_quantity: int | None = Field(default=None, ge=0)
    remaining_quantity: int | None = Field(default=None, ge=0)
    instructions: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class MedicationRead(BaseModel):
    id: UUID
    patient_user_id: UUID
    patient_display_name: str
    prescribed_by_doctor_id: UUID | None
    name: str
    dosage: str
    frequency: str
    meal_timing: str | None
    route: str | None
    start_date: date
    end_date: date | None
    refill_quantity: int | None
    remaining_quantity: int | None
    instructions: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
