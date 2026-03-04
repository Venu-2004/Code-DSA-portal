# Deployment Guide (Free Hosting)

This project is best deployed with:
- **Frontend (React)** on **Vercel**
- **Backend (Spring Boot)** on **Render**
- **PostgreSQL database** on **Render Postgres** / **Neon** / **Supabase**

---

## 1) Push code to GitHub

1. Create a GitHub repository.
2. Push this project folder to that repo.

---

## 2) Deploy Backend on Render

1. Go to Render Dashboard.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repo.
4. Set **Root Directory** to: `backend`
5. Select deployment method:
   - If Render detects `Dockerfile` automatically, use Docker deploy.
6. Exposed port: `8080`
7. Add environment variables in Render:

Required:
- `DB_HOST`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`

Optional (if you use these features):
- `GEMINI_API_KEY`
- `JUDGE0_API_KEY`

8. Deploy and wait for success.
9. Copy backend URL, e.g.:
   - `https://your-backend.onrender.com`

Backend API base becomes:
- `https://your-backend.onrender.com/api`

---

## 3) Deploy Frontend on Vercel

1. Go to Vercel Dashboard.
2. Click **Add New** -> **Project**.
3. Import the same GitHub repo.
4. Configure project:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add Environment Variable:
   - `REACT_APP_API_URL = https://your-backend.onrender.com/api`
6. Deploy.

This repo already includes `frontend/vercel.json` to handle React route refresh (SPA rewrite).

---

## 4) Verify

Open your Vercel URL and check:
- Login/Register works
- Dashboard loads
- API calls succeed (no CORS/network errors)

---

## 5) If API fails from frontend

Check in Vercel project settings:
- `REACT_APP_API_URL` is correct and includes `/api`

Check backend Render logs for errors.

---

## Notes

- Vercel is excellent for frontend hosting.
- Running a full Spring Boot backend on Vercel free tier is not recommended.
- Keep frontend and backend as separate services for a stable free setup.
