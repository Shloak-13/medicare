from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    doctor_id: UUID | None = None
    scheduled_at: datetime
    reason: str | None = Field(default=None, max_length=1000)
    status: str = Field(default="scheduled", max_length=40)
    notes: str | None = Field(default=None, max_length=2000)


class AppointmentUpdate(BaseModel):
    doctor_id: UUID | None = None
    scheduled_at: datetime | None = None
    reason: str | None = Field(default=None, max_length=1000)
    status: str | None = Field(default=None, max_length=40)
    notes: str | None = Field(default=None, max_length=2000)


class AppointmentRead(BaseModel):
    id: UUID
    patient_user_id: UUID
    patient_display_name: str
    doctor_id: UUID | None
    doctor_name: str | None
    scheduled_at: datetime
    reason: str | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

