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

- Set the same backend env vars on Railway (`MONGODB_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`, `CLIENT_URLS`).
- Point `CLIENT_URL` / `CLIENT_URLS` at your deployed frontend origin(s) so CORS allows browser requests.
- On the frontend service, set `VITE_API_URL` to the public backend URL when not using a same-origin proxy.

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
