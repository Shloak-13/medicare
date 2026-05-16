from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: UUID
    display_name: str
    email: EmailStr
    relationship_label: str
    date_of_birth: date | None
    phone: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

