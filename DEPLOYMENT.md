# Vercel + Render Deployment Walkthrough

This repository is split into a React frontend in [frontend/](frontend) and an Express backend in [backend/](backend). The cleanest production setup is:

- Frontend on Vercel
- Backend on Render
- Frontend requests routed to the Render backend with `VITE_API_BASE_URL`

## 1. Prepare the backend

Deploy the [backend/](backend) folder as a Render Web Service.

Recommended settings:

- **Root directory**: `backend`
- **Runtime**: Node
- **Build command**: `npm install`
- **Start command**: `npm start`

Environment variables to set in Render:

- `PORT` is provided by Render automatically
- `HOST=0.0.0.0`
- `NODE_ENV=production`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `OPENAI_API_KEY=...`
- `GROQ_API_KEY=...`
- `SUPABASE_PROJECT_ID=...`
- `SUPABASE_ANON_KEY=...`
- `SUPABASE_FUNCTION_NAME=make-server-12f1d05f`
- `SMTP_HOST=...`
- `SMTP_PORT=587`
- `SMTP_USER=...`
- `SMTP_PASS=...`

If you do not have MongoDB yet, the backend can still boot, but database-backed features will remain limited.

After deployment, copy the Render service URL, for example:

`https://your-backend-service.onrender.com`

## 2. Prepare the frontend

Deploy the [frontend/](frontend) folder as a Vercel project.

Recommended settings:

- **Root directory**: `frontend`
- **Build command**: `npm run build`
- **Output directory**: `dist`

Set this Vercel environment variable:

- `VITE_API_BASE_URL=https://your-backend-service.onrender.com`

This keeps the browser from calling Overpass or Supabase directly. The frontend sends those requests to your Render backend, and the backend proxies them server-side.

## 3. Deploy order

1. Deploy the backend to Render first.
2. Verify the backend health endpoint works.
3. Deploy the frontend to Vercel.
4. Set `VITE_API_BASE_URL` on Vercel to the Render URL.
5. Open the Vercel URL and test alert sending, planner routes, and map pages.

## 4. What to verify after deployment

- The frontend loads without 404s on refresh.
- `/api/send-alert` reaches the Render backend.
- `/api/agentic-plan` returns either an LLM-backed or fallback plan.
- Health check responds from the backend.

## 5. Local development remains unchanged

Use the existing local scripts when working in the repo:

- Frontend: `cd frontend && npm run dev`
- Backend: `cd backend && npm run dev`
- Full local stack: `npm run dev:all` from the repo root