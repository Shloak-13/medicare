from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FileUploadRead(BaseModel):
    id: UUID
    patient_user_id: UUID
    patient_display_name: str
    medical_record_id: UUID | None
    uploaded_by_user_id: UUID
    original_filename: str
    storage_provider: str
    storage_key: str
    mime_type: str
    byte_size: int
    checksum_sha256: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

