from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import FamilyGroupMember


def can_read_patient_data(db: Session, actor_user_id: UUID, patient_user_id: UUID) -> bool:
    if actor_user_id == patient_user_id:
        return True

    actor_groups = select(FamilyGroupMember.family_group_id).where(
        FamilyGroupMember.user_id == actor_user_id
    )

    shared_group = db.scalar(
        select(FamilyGroupMember.family_group_id).where(
            FamilyGroupMember.user_id == patient_user_id,
            FamilyGroupMember.family_group_id.in_(actor_groups),
        )
    )
    return shared_group is not None


def can_write_patient_data(actor_user_id: UUID, patient_user_id: UUID) -> bool:
    return actor_user_id == patient_user_id

