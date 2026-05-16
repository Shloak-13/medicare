from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MedicalRecordCreate(BaseModel):
    record_type: str = Field(min_length=2, max_length=50)
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    record_date: date
    doctor_id: UUID | None = None


class MedicalRecordUpdate(BaseModel):
    record_type: str | None = Field(default=None, min_length=2, max_length=50)
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    record_date: date | None = None
    doctor_id: UUID | None = None


class MedicalRecordRead(BaseModel):
    id: UUID
    patient_user_id: UUID
    patient_display_name: str
    doctor_id: UUID | None
    record_type: str
    title: str
    description: str | None
    record_date: date
    created_by_user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
