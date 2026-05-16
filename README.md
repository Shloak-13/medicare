# Family Healthcare Management Application

Production-style Medicare / family healthcare management app for four family members: Mom, Dad, Me, and Sister.

## Recommended Stack

- Frontend: Next.js App Router, TypeScript, TailwindCSS, shadcn/ui
- Backend: FastAPI, Python, SQLAlchemy 2.x, Pydantic
- Database: PostgreSQL
- Auth: JWT access tokens with bcrypt password hashing
- File storage: S3-compatible object storage in production, local disk in development
- Analytics: SQL-backed metrics exposed through API, rendered with Recharts
- Deployment: Render/Fly.io/Railway for API, Vercel for frontend, managed PostgreSQL, S3/Cloudinary for files

## Current Step

Step 1 is the foundation:

- high-level architecture
- folder structure
- normalized PostgreSQL schema
- authorization model for family dataset boundaries

Authentication and APIs come next.

## Folder Structure

```text
.
|-- apps
|   |-- api              # FastAPI backend, auth, APIs, DB access
|   `-- web              # Next.js frontend dashboard
|-- database
|   `-- migrations       # SQL migrations
|-- docs                 # Architecture and implementation notes
|-- infra                # Deployment and local infrastructure
`-- docker-compose.yml   # Local PostgreSQL and service wiring
```

## Run Locally

The application code will be implemented incrementally. For this foundation step, you can start the database once Docker is available:

```bash
docker compose up -d db
```

Then apply the schema migration using your PostgreSQL client:

```bash
psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
```

The next step will add the FastAPI backend, environment variables, JWT auth, and seed users.

## Deploy Online

Deployment notes are in:

```text
docs/deployment.md
```

The intended production setup is:

- Render for FastAPI and PostgreSQL
- Vercel for Next.js
- authenticated access only for private healthcare data
