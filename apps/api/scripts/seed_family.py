from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import FamilyGroup, FamilyGroupMember, Role, User

DEFAULT_PASSWORD = "ChangeMe123!"

USERS = [
    {"display_name": "Mom", "email": "mom@example.com", "relationship_label": "mom", "group": "parents"},
    {"display_name": "Dad", "email": "dad@example.com", "relationship_label": "dad", "group": "parents"},
    {"display_name": "Me", "email": "me@example.com", "relationship_label": "me", "group": "siblings"},
    {"display_name": "Sister", "email": "sister@example.com", "relationship_label": "sister", "group": "siblings"},
]


def main() -> None:
    db = SessionLocal()
    try:
        role = db.scalar(select(Role).where(Role.name == "family_member"))
        if role is None:
            raise RuntimeError("Run the database migration before seeding users.")

        groups = {
            group.name: group
            for group in db.scalars(select(FamilyGroup).where(FamilyGroup.name.in_(["parents", "siblings"])))
        }

        for item in USERS:
            user = db.scalar(select(User).where(User.email == item["email"]))
            if user is None:
                user = User(
                    role_id=role.id,
                    display_name=item["display_name"],
                    email=item["email"],
                    password_hash=hash_password(DEFAULT_PASSWORD),
                    relationship_label=item["relationship_label"],
                    is_active=True,
                )
                db.add(user)
                db.flush()

            group = groups[item["group"]]
            membership = db.get(FamilyGroupMember, (group.id, user.id))
            if membership is None:
                db.add(FamilyGroupMember(family_group_id=group.id, user_id=user.id))

        db.commit()
        print("Seeded family users.")
        print("Default password for all users:", DEFAULT_PASSWORD)
    finally:
        db.close()


if __name__ == "__main__":
    main()
