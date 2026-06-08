# Gmail Bulk Mail Sender MVP

A full-stack web application for connecting Gmail, creating email templates, uploading recipients, previewing campaigns, and sending bulk emails through the Gmail API.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Tailwind CSS, ShadCN-style UI, React Router |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Auth | Google OAuth 2.0 |
| Email | Gmail API |

## Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (free tier works)
- Google Cloud project with OAuth 2.0 credentials

## Project Structure

```
Mail_sender/
├── client/          # React frontend (port 5173)
├── backend/         # Express API (port 3001)
├── .env.example     # Environment variable template
└── package.json     # Root scripts
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
copy .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3001/api/auth/callback` |
| `SESSION_SECRET` | Random string (min 16 chars) |
| `ENCRYPTION_KEY` | Random string (min 32 chars) for token encryption |
| `CLIENT_URL` | `http://localhost:5173` |
| `MONGODB_URI` | Full MongoDB Atlas connection string (see below) |

### 3. MongoDB Atlas setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and create a free cluster
2. **Database Access** → create a database user (username + password)
3. **Network Access** → add your IP (or `0.0.0.0/0` for development)
4. **Connect** → **Drivers** → copy the connection string
5. Paste it into `.env` as `MONGODB_URI`

Example (replace placeholders with your values):

```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/mail_sender?retryWrites=true&w=majority
```

**Important:**
- Replace `<password>` with your real database password
- If your password contains special characters (`@`, `#`, `:`, etc.), [URL-encode](https://www.urlencoder.org/) them
- Keep `/mail_sender` before the `?` — that is the database name used by this app

### 4. Google Cloud Console setup

1. Create a project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Gmail API**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add authorized redirect URI: `http://localhost:3001/api/auth/callback`
5. Add authorized JavaScript origin: `http://localhost:5173`
6. Configure OAuth consent screen and add test users (while in testing mode)

Required OAuth scopes:

- `gmail.send`
- `gmail.compose`
- `userinfo.profile`
- `userinfo.email`

### 5. Run the application

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## User Flow

1. **Login** — Sign in with Google
2. **Dashboard** — View stats and recent campaigns
3. **Create Campaign** — Set name, subject, and body
4. **Upload Recipients** — Paste emails or upload CSV (max 500)
5. **Preview** — Review recipients and email content
6. **Send** — Sends via Gmail API in batches of 25 with 2s delays
7. **Sending Status** — Live progress with sent/failed counts

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Get Google OAuth URL |
| GET | `/api/auth/google` | Redirect to Google OAuth |
| GET | `/api/auth/callback` | OAuth callback |
| GET | `/api/auth/me` | Current user + dashboard stats |
| POST | `/api/auth/logout` | Log out |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns` | List campaigns |
| GET | `/api/campaigns/:id` | Get campaign |
| POST | `/api/campaigns/:id/recipients` | Add recipients (JSON or CSV) |
| POST | `/api/campaigns/:id/send` | Start sending |
| GET | `/api/campaigns/:id/status` | Send progress |

## CSV Format

```csv
email
john@gmail.com
alice@gmail.com
bob@gmail.com
```

## Sending Limits

- Maximum **500** recipients per campaign
- **25** emails per batch
- **2-second** delay between batches
- Failed emails are marked individually; sending continues for remaining recipients

## Storage

Data is persisted in **MongoDB** collections:

- `users` — Google account + encrypted OAuth tokens
- `campaigns` — campaign name, subject, body, status
- `recipients` — email addresses per campaign
- `emaillogs` — send results per recipient

Data survives server restarts.

## Build for Production

```bash
npm run build
```

## Security Notes

- OAuth tokens are encrypted at rest using AES-256-GCM
- Sessions use HTTP-only cookies
- All inputs are validated with Zod
- CSV uploads are sanitized and size-limited (5 MB)

## Phase 1 Scope

This MVP includes Gmail connect, templates, recipient upload, preview, and send only.

**Not included:** AI personalization, analytics, tracking, lead enrichment, follow-up sequences, or campaign automation.
