from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, appointments, auth, doctors, file_uploads, health, medical_records, medications, users
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(users.router, prefix="/api/users", tags=["users"])
    app.include_router(doctors.router, prefix="/api/doctors", tags=["doctors"])
    app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"])
    app.include_router(file_uploads.router, prefix="/api/files", tags=["files"])
    app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
    app.include_router(medical_records.router, prefix="/api/records", tags=["medical records"])
    app.include_router(medications.router, prefix="/api/medications", tags=["medications"])

    return app


app = create_app()
