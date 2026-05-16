from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class DoctorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    specialty: str = Field(min_length=2, max_length=80)
    clinic_name: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=40)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=2000)


class DoctorUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    specialty: str | None = Field(default=None, min_length=2, max_length=80)
    clinic_name: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=40)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=2000)


class DoctorRead(BaseModel):
    id: UUID
    owner_user_id: UUID
    owner_display_name: str
    name: str
    specialty: str
    clinic_name: str | None
    phone: str | None
    email: EmailStr | None
    address: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

