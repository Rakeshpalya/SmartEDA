# SmartEDA — Deployment Guide

This document provides complete instructions for deploying the **SmartEDA** platform (React + Vite frontend and FastAPI backend) into production.

---

## Architecture Overview

```
                      ┌──────────────────────┐
                      │     Web Browser      │
                      └──────────┬───────────┘
                                 │
                 HTTPS Requests  │
                                 ▼
                      ┌──────────────────────┐
                      │   Netlify (Frontend) │
                      │      React + Vite    │
                      └──────────┬───────────┘
                                 │
                   VITE_API_BASE_URL (REST)
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │  FastAPI (Backend)   │
                      │  Render / Railway /  │
                      │  Fly.io / AWS EC2    │
                      └──────────┬───────────┘
                                 │
                      ┌──────────┴───────────┐
                      │  Pandas / Scikit-ML  │
                      │  Statistical Engine  │
                      └──────────────────────┘
```

> **IMPORTANT**: Netlify is a static and JAMstack hosting platform. It hosts the built React/Vite frontend. The Python backend (which relies on Pandas, NumPy, SciPy, and Scikit-Learn for active EDA and machine learning training) must run on a containerized or Python-capable cloud host such as **Render**, **Railway**, **Fly.io**, or **AWS EC2**.

---

## 1. Frontend Deployment (Netlify)

### Option A: Automatic Deployment via Git (Recommended)

1. Log in to your [Netlify Dashboard](https://app.netlify.com/).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Choose **GitHub** and authorize access to your repository: `https://github.com/Rakeshpalya/SmartEDA.git`.
4. Configure the build settings (or let Netlify read `netlify.toml` from the repository root):
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. **Environment Variables**:
   Under **Site configuration** > **Environment variables**, add:
   - `VITE_API_BASE_URL`: The public URL of your deployed FastAPI backend (e.g., `https://smarteda-api.onrender.com`).
6. Click **Deploy Site**.

### SPA Routing & Redirects
The repository includes `frontend/public/_redirects` and `netlify.toml` which automatically route all single-page application URLs (`/categorical`, `/machine-learning`, `/report`, etc.) back to `index.html` with an HTTP 200 status code, preventing 404 errors on browser page reloads.

---

## 2. Backend Deployment (FastAPI on Render / Railway / Fly.io)

### Deploying on Render (Free Tier with render.yaml Blueprint)

The repository includes a ready-to-use `render.yaml` configuration:

1. Sign up / Log in to [Render](https://render.com/).
2. Click **"New +"** > **"Blueprint"** (or **"Web Service"**).
3. Connect your GitHub repository: `https://github.com/Rakeshpalya/SmartEDA.git`.
4. Render will automatically detect `render.yaml` and configure:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `CORS_ORIGINS`: `https://smarteda.netlify.app,http://localhost:5173`
5. Click **Apply / Create Web Service**.
6. Once deployed, copy your Render URL (e.g., `https://smarteda-backend.onrender.com`).
7. Paste this URL into your Netlify frontend's `VITE_API_BASE_URL` environment variable setting and trigger a frontend redeploy.

---

## 3. Local Development Setup

To run both services locally on your development machine:

### Backend
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API docs available at: `http://127.0.0.1:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Accessible at: `http://localhost:5173/`

---

## 4. Verification Checklist

- [x] Frontend builds without errors (`npm run build`).
- [x] All 13 automated backend/EDA verification tests pass (`python backend/verify_test.py`).
- [x] SPA fallback configured via `_redirects` and `netlify.toml`.
- [x] Zero hardcoded localhost references in production frontend bundle (`import.meta.env.VITE_API_BASE_URL`).
- [x] Backend CORS origins configurable via `CORS_ORIGINS`.
- [x] Render 1-click blueprint provided via `render.yaml`.
- [x] Raw data immutability strictly preserved across all cleaning operations.
