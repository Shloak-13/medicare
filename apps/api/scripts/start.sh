#!/usr/bin/env sh
set -eu

psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f database/migrations/002_medication_meal_timing.sql
python scripts/seed_family.py

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"

