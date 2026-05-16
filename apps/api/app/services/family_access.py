from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import FamilyGroupMember


def get_authorized_patient_ids(db: Session, actor_user_id: UUID) -> set[UUID]:
    group_ids = list(
        db.scalars(
            select(FamilyGroupMember.family_group_id).where(
                FamilyGroupMember.user_id == actor_user_id
            )
        )
    )

    authorized_ids = {actor_user_id}
    if not group_ids:
        return authorized_ids

    group_member_ids = db.scalars(
        select(FamilyGroupMember.user_id).where(
            FamilyGroupMember.family_group_id.in_(group_ids)
        )
    )
    authorized_ids.update(group_member_ids)
    return authorized_ids

