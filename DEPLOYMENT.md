# Deployment: Railway (backend) + Vercel (frontend)

## URLs

| Service | URL |
|---------|-----|
| Backend (Railway) | https://mail-sender-server-production.up.railway.app |
| Frontend (Vercel) | `https://YOUR-APP.vercel.app` (replace with yours) |

---

## Railway — backend environment variables

Set these in **Railway → your service → Variables**:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://YOUR-APP.vercel.app` (your exact Vercel URL, no trailing slash) |
| `SESSION_SECRET` | same as local `.env` |
| `ENCRYPTION_KEY` | same as local `.env` |
| `MONGODB_URI` | your Atlas connection string |
| `MONGODB_DB_NAME` | `mail_sender` |
| `GOOGLE_CLIENT_ID` | from Google Cloud |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud |
| `GOOGLE_REDIRECT_URI` | `https://mail-sender-server-production.up.railway.app/api/auth/callback` |

**Railway settings:**
- Root directory: `backend` (or build from repo root with `npm run build -w backend`)
- Start command: `npm run start -w backend` or `node backend/dist/index.js`

**Health check:** https://mail-sender-server-production.up.railway.app/api/health

---

## Vercel — frontend environment variables

Set in **Vercel → Project → Settings → Environment Variables**:

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://mail-sender-server-production.up.railway.app/api` |

Redeploy Vercel after adding this variable (Vite bakes env vars at build time).

**Vercel settings:**
- Framework: Vite (or use root `vercel.json`)
- Root directory: repository root (uses `vercel.json` buildCommand)

---

## Google Cloud Console

Add production URLs under **OAuth 2.0 Client → Authorized redirect URIs**:

```
https://mail-sender-server-production.up.railway.app/api/auth/callback
```

Add under **Authorized JavaScript origins**:

```
https://YOUR-APP.vercel.app
```

---

## MongoDB Atlas

**Network Access** → allow Railway egress (or `0.0.0.0/0` for development).

---

## Verify deployment

1. Open `https://mail-sender-server-production.up.railway.app/api/health` → `{"status":"ok"}`
2. Open your Vercel URL → Login page loads
3. Sign in with Google → redirects back to dashboard
4. Create a test campaign

---

## Common issues

| Problem | Fix |
|---------|-----|
| CORS error | `CLIENT_URL` on Railway must exactly match Vercel URL |
| Login works but `/auth/me` fails | Set `VITE_API_URL` on Vercel and redeploy |
| Google redirect mismatch | `GOOGLE_REDIRECT_URI` must match Google Console exactly |
| Cookies not sent | Both sites must use HTTPS; `NODE_ENV=production` on Railway |
