# Deployment Guide

This app can be made public through a shared URL while still requiring login.

Important: public URL does not mean public medical data. The frontend and API can be reached online, but protected data still requires JWT login and family authorization checks.

## Recommended Hosting

- Backend API: Render Docker web service
- Database: Render PostgreSQL
- Frontend: Vercel Next.js app
- File storage now: local container storage for demo
- File storage later: S3, Cloudinary, or Firebase Storage

This is beginner-friendly and maps cleanly to the current monorepo.

## Deployment Architecture

```text
User browser
  -> Vercel frontend URL
  -> Render FastAPI backend URL
  -> Render PostgreSQL database
  -> Render local upload folder for demo
```

## Step 1: Push Project To GitHub

Create a GitHub repository and push:

```powershell
cd "C:\Users\sapna shetty\Desktop\medicare"
git init
git add .
git commit -m "Initial Medicare family healthcare app"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Deploy Backend On Render

Render can read `render.yaml` from the repository root and create:

- `medicare-api`
- `medicare-db`

The checked-in `render.yaml` uses Render's free instance types.

Important: Render may still ask for a card for account verification in some workspaces. If it does, do not continue if you do not want to provide one.

After the backend is created, set this Render environment variable:

```text
CORS_ORIGINS=https://YOUR-VERCEL-FRONTEND.vercel.app
```

After the first deploy, copy the backend URL. It will look like:

```text
https://medicare-api.onrender.com
```

## Step 3: Production Database Migrations

The Render backend container runs migrations automatically on startup using:

```text
apps/api/scripts/start.sh
```

It applies the SQL files inside `apps/api/database/migrations` and seeds the four demo users.

## Step 4: Deploy Frontend On Vercel

Create a Vercel project from the same GitHub repo.

Use these settings:

```text
Framework: Next.js
Root Directory: apps/web
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

Set this Vercel environment variable:

```text
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-BACKEND.onrender.com
```

Deploy. Vercel will give you a public frontend URL.

## Step 5: Final Production Check

Open the Vercel URL and verify:

- login page loads
- `me@example.com` can log in
- dashboard loads
- records, medications, doctors, appointments, uploads, and analytics pages load
- unauthorized cross-family data remains blocked

## Free Hosting Limitations

The free Render setup is for demo use:

- the backend can sleep after inactivity
- the first request after sleep can be slow
- free Postgres can expire or have limits depending on Render's current policy
- uploaded files may disappear after redeploy/restart because there is no paid persistent disk

For durable production uploads, use S3, Cloudinary, Firebase Storage, or a paid persistent disk.

## Public Access Rule

Anyone with the frontend link can open the login page.

Only authenticated users can access protected healthcare data.

Current demo accounts:

```text
mom@example.com
dad@example.com
me@example.com
sister@example.com
```

Current demo password:

```text
ChangeMe123!
```

Before real use, change these passwords and replace all demo emails.
