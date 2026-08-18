# Venue Booking / Hargeisa Hall Finder

A full-stack **MERN** application for discovering and booking hotel event halls in Hargeisa. Customers browse approved venues, hotel owners manage halls and booking requests, and admins verify hotels and review platform metrics.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** running locally, or a MongoDB Atlas connection string
- A modern browser

## Backend setup

```bash
cd backend
copy .env.example .env
# macOS/Linux: cp .env.example .env
npm install
npm run dev
```

Configure `backend/.env` (never commit real secrets):

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWT access tokens |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Primary frontend origin for CORS |
| `CLIENT_URLS` | Optional comma-separated list of allowed CORS origins |

Example placeholders:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/venue-booking
JWT_SECRET=change_me_to_a_long_random_string
CLIENT_URL=http://127.0.0.1:5173
CLIENT_URLS=http://localhost:5173,http://127.0.0.1:5173
```

API runs at `http://localhost:5000` by default. Health check: `GET /api/health`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend (Vite) typically runs at `http://127.0.0.1:5173`.

Optional `frontend/.env`:

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend base URL. Leave empty in local dev if Vite proxies `/api`. Set for production, e.g. `https://your-api.up.railway.app` |

## Railway notes

HallHub is a **two-service** app. Deploy backend and frontend separately in the same Railway project.

### What you need before deploying

1. A [Railway](https://railway.com) account
2. A [GitHub](https://github.com) account with this repo pushed
3. A MongoDB database — [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster is recommended
4. These values ready:
   - `MONGODB_URI` — Atlas connection string
   - `JWT_SECRET` — a long random secret (not the local one)
   - Backend public URL after first deploy
   - Frontend public URL after first deploy

### 1. Create a Railway project from GitHub

Connect the GitHub repo, then add **two services** from the same repo.

### 2. Backend service

- **Root directory:** `backend`
- Railway will run `npm start`
- Health check: `/api/health`

Variables:

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/hallhub` |
| `JWT_SECRET` | long random string |
| `CLIENT_URL` | `https://your-frontend.up.railway.app` |
| `NODE_ENV` | `production` |

`PORT` is set by Railway automatically. Do not set it yourself.

After the backend deploys, copy its public URL, e.g. `https://hallhub-api.up.railway.app`.

### 3. Frontend service

- **Root directory:** `frontend`
- Build command: `npm run build`
- Start command: `npm start`

Variables (**must be set before / during the build**):

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://your-backend.up.railway.app` |

No trailing slash. After you set `VITE_API_URL`, **redeploy the frontend** so Vite bakes it into the build.

Then go back to the backend and set `CLIENT_URL` to the frontend public URL (no trailing slash), and redeploy the backend if needed.

### 4. Atlas network access

In MongoDB Atlas, allow Railway to connect:

- Network Access → Add IP → `0.0.0.0/0` (for student/demo deploys)

### Uploads note

Hall images and videos are stored on the backend disk. On Railway they can disappear after a redeploy unless you attach a **volume** to `/app/uploads`. For a demo, that is optional.

Local Vite still proxies `/api` when `VITE_API_URL` is empty.

## Main API prefixes

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Register, login, current user / profile |
| `/api/hotels` | Public hotel listings + owner hotel management |
| `/api/halls` | Public halls + owner hall CRUD |
| `/api/bookings` | Customer bookings + owner booking workflow |
| `/api/admin` | Admin hotel approval and reports (admin JWT required) |

### Admin reports

- `GET /api/admin/reports/overview` — platform overview counts (users, hotels, halls, bookings, revenue)
- `GET /api/admin/reports` — same payload (alias)

Both require `Authorization: Bearer <token>` and an **admin** role.

## Project layout

```
Venue-Booking-Management-System/
├── backend/          # Express API, models, controllers, routes
├── frontend/         # React (Vite) client
└── README.md
```

## License

Academic / educational use — Telesom Academy MERN project.
