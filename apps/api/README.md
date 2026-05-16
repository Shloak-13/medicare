# FastAPI Backend

## What This Backend Does

This backend provides:

- FastAPI application setup
- PostgreSQL database connection
- SQLAlchemy models matching the initial database schema
- bcrypt password hashing
- JWT login endpoint
- protected current-user endpoint
- seed script for Mom, Dad, Me, and Sister

## Local Setup

Run these commands from:

```powershell
C:\Users\sapna shetty\Desktop\medicare\apps\api
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create the local environment file:

```powershell
copy .env.example .env
```

Run the backend:

```powershell
uvicorn app.main:app --reload
```

Open the API docs:

```text
http://localhost:8000/docs
```

