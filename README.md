\# Hargeisa Hall Finder

\## Venue Booking Management System


### 1. Project Title and Purpose

\*\*Title:\*\* Hargeisa Hall Finder — Venue Booking Management System

\*\*Purpose:\*\*

A full-stack \*\*MERN\*\* web application that helps people in Hargeisa discover and book hotel event halls online. Hotel owners register their venues, manage halls and booking requests, while platform admins verify hotels and monitor operations, revenue, and performance.


The system connects three user types:

| Role | Goal |

|------|------|

| \*\*Customer\*\* | Browse approved hotels/halls, request bookings, track appointments \& deposits |

| \*\*Hotel Owner\*\* | Register a hotel, manage halls, process booking workflow, view hotel reports |

| \*\*Admin\*\* | Approve/reject hotels, oversee venues, analyze platform reports |


\*\*Repository:\*\* \[https://github.com/Rahmomoktar/Hall-Managment-System](https://github.com/Rahmomoktar/Hall-Managment-System)

\---

\
### 2. Team Members with Assigned Roles

| Name | Role | Responsibilities |

|------|------|------------------|

| \*\*Naima Muse\*\* | Frontend Lead | Public pages, customer portal, React routing, UI integration |

| \*\*Rahma Mukhtar\*\* | Backend Lead | Express API, MongoDB models, JWT auth, booking workflow, owner/admin reports |

| \*\*Naima\*\* | UI/UX Designer | Visual design system, page layouts, screenshots \& design documentation |

| \*\*Abdiasis\*\* | Full-Stack Developer | Owner portal features, halls CRUD, booking request handling |

| \*\*Abdiqani\*\* | Full-Stack Developer | Admin portal, hotel approvals, venues directory, analytics reports |

| \*\*Sahal\*\* | QA \& Documentation | Testing flows, README/environment docs, demo preparation |

---


\### 3. Technologies Used

| Layer | Technology |

|-------|------------|

| Frontend | React 18, Vite, React Router v6, Axios, Recharts, react-easy-crop |

| Styling | Global CSS (`frontend/src/index.css`) |

| Backend | Node.js, Express.js 5 |

| Database | MongoDB + Mongoose |

| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |

| Uploads | Multer (hall images \& profile avatars) |

| Tooling | Nodemon, Playwright (UI screenshot capture) |

| Version control | Git + GitHub |

---

### 4. Installation Instructions

#### Prerequisites

\- Node.js \*\*18+\*\* and npm  

\- MongoDB running locally (or a MongoDB Atlas URI)  

\- Modern browser (Chrome / Edge / Firefox)


#### Setup

```bash

\# 1) Clone the repository

git clone https://github.com/Rahmomoktar/Hall-Managment-System.git

cd Hall-Managment-System


\# 2) Backend dependencies

cd backend

npm install


\# 3) Create backend environment file

copy .env.example .env

\# On macOS/Linux: cp .env.example .env

\# Then edit backend/.env with your values


\# 4) Frontend dependencies

cd ../frontend

npm install


\# Optional local frontend env (usually not needed — Vite proxies /api)

copy .env.example .env

```

\#### Run (two terminals)


```bash

\# Terminal 1 — API

cd backend

npm run dev

```

```bash

\# Terminal 2 — Frontend

cd frontend

npm run dev

```

| Service | URL |

|---------|-----|

| Frontend | http://127.0.0.1:5173 |

| Backend API | http://localhost:5000 |

| Health check | http://localhost:5000/api/health |


\#### Seed default admin



```bash

cd backend

npm run seed:admin

```


| Field | Value |

|-------|-------|

| Email | `admin@hargeisahallfinder.com` |

| Password | `AdminPass123!` |



Change this password before any production use.



\---



\### 5. Environment Variable Configuration



\#### Backend — `backend/.env`



Copy from `backend/.env.example`:



```env

PORT=5000

MONGO\_URI=mongodb://127.0.0.1:27017/hall-management

JWT\_SECRET=change\_this\_to\_a\_long\_random\_secret

NODE\_ENV=development

CLIENT\_URL=http://localhost:5173

CLIENT\_URLS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174

FRONTEND\_URL=http://localhost:5173

```

| Variable | Required | Purpose |

|----------|----------|---------|

| `PORT` | Yes | API listen port (hosting platforms often inject this) |

| `MONGO\_URI` | Yes | MongoDB connection string |

| `JWT\_SECRET` | Yes | Secret for signing JWT access tokens |

| `NODE\_ENV` | No | `development` or `production` |

| `CLIENT\_URL` | Recommended | Primary frontend origin for CORS |

| `CLIENT\_URLS` | Recommended | Comma-separated allowed CORS origins |

| `FRONTEND\_URL` | Optional | Extra allowed frontend origin |



\#### Frontend — `frontend/.env`



Copy from `frontend/.env.example`:



```env

\# Leave empty in local dev (Vite proxies /api and /uploads to the backend).

\# On production, set your public API URL:

VITE\_API\_URL=

```

| Variable | Purpose |

|----------|---------|

| `VITE\_API\_URL` | Backend base URL. Empty locally (proxy). Set on Railway/production, e.g. `https://your-api.up.railway.app` |


> Never commit real `.env` files. They are gitignored.


\---

\### 6. API Endpoints Documentation

Base URL (local): `http://localhost:5000`  


Protected routes require:


```http

Authorization: Bearer <jwt-token>

```

\#### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |

|--------|----------|------|-------------|

| POST | `/api/auth/register` | Public | Register customer or hotel owner |

| POST | `/api/auth/login` | Public | Login and receive JWT |

| GET | `/api/auth/me` | User | Current user profile |

| PUT | `/api/auth/profile` | User | Update profile / avatar |


\#### Hotels — `/api/hotels`


| Method | Endpoint | Auth | Description |

|--------|----------|------|-------------|

| GET | `/api/hotels` | Public | List approved hotels |

| GET | `/api/hotels/approved` | Public | List approved hotels |

| GET | `/api/hotels/:id` | Public | Public hotel details + halls |

| POST | `/api/hotels` | Owner | Create hotel application |

| GET | `/api/hotels/my-hotel` | Owner | Owner’s hotel profile |

| PUT | `/api/hotels/my-hotel` | Owner | Update hotel profile |

| PATCH | `/api/hotels/my-hotel/approval-alert-seen` | Owner | Dismiss approval alert |

\

#### Halls — `/api/halls`


| Method | Endpoint | Auth | Description |

|--------|----------|------|-------------|

| GET | `/api/halls` | Public | Public halls (approved hotels) |

| GET | `/api/halls/:id` | Public | Hall details |

| GET | `/api/halls/my-halls` | Owner | Owner hall inventory |

| POST | `/api/halls` | Owner | Create hall (+ images) |

| PUT | `/api/halls/:id` | Owner | Update hall |

| DELETE | `/api/halls/:id` | Owner | Delete hall |


#### Bookings — `/api/bookings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/bookings/unavailable-dates/:hallId` | Public | Blocked event dates |
| POST | `/api/bookings` | Customer | Create booking request |
| GET | `/api/bookings/my-bookings` | Customer | Customer bookings |
| DELETE | `/api/bookings/:id` | Customer | Cancel pending booking |
| GET | `/api/bookings/owner-requests` | Owner | Hotel booking requests |
| PATCH | `/api/bookings/:id/status` | Owner | Accept / reject / cancel |
| PATCH | `/api/bookings/:id/confirm` | Owner | Confirm + deposit |
| PATCH | `/api/bookings/:id/appointment` | Owner | Schedule inspection visit |

#### Owner reports — `/api/owner`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/owner/reports` | Owner | Hotel-scoped report (`range`, `from`, `to`) |

#### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | Dashboard counters |
| GET | `/api/admin/hotels` | Admin | All hotels (filter by status) |
| GET | `/api/admin/hotels/pending` | Admin | Pending applications |
| PATCH | `/api/admin/hotels/:id/status` | Admin | Approve / reject / set pending |
| GET | `/api/admin/venues` | Admin | Hotels + halls directory |
| GET | `/api/admin/reports` | Admin | Operations / revenue / performance data |

#### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API + Mongo connectivity check |

---
### 7. Implemented Features

#### Public
- Landing page (hero, services, about, contact)
- Browse approved hotels and halls
- Hotel details + hall booking page
- Customer / owner signup and login

#### Customer portal
- Dashboard overview
- My Bookings (track status, deposit invoice print)
- My Appointments (inspection visits + alert badge)
- Profile update with avatar crop

#### Hotel owner portal
- Hotel profile registration & updates
- Pending / approved / rejected status banners
- Halls CRUD with images, amenities, availability
- Booking request workflow: accept → schedule visit → confirm deposit / cancel
- **Hotel Report** (own hotel only): KPIs, charts, hall performance, date filters, print

#### Admin portal
- Dashboard with pending approvals & shortcuts
- Hotel Approvals (approve / reject with reason / set pending)
- All Venues directory (hall-focused, read-only)
- Reports: Operations, Revenue, Performance (filters + CSV export)

#### Cross-cutting
- JWT role-based protection (frontend + backend)
- Same-day hall booking conflict prevention
- Image uploads (halls & avatars)
- Responsive UI with shared design language

---
### 8. Screenshots or Demo Links

**GitHub:** [Rahmomoktar/Hall-Managment-System](https://github.com/Rahmomoktar/Hall-Managment-System)  

**Local demo:** http://127.0.0.1:5173 (after running frontend + backend)

**Full screenshot pack (27 PNGs):** [`frontend/UIux Design/screenshots/`](frontend/UIux%20Design/screenshots/)

#### Sample screenshots

**Home**

![Home](frontend/UIux%20Design/screenshots/01-public-home.png)

**Customer dashboard**

![Customer dashboard](frontend/UIux%20Design/screenshots/08-customer-dashboard.png)

**Owner bookings**

![Owner bookings](frontend/UIux%20Design/screenshots/17-owner-bookings.png)

**Admin approvals**

![Admin approvals](frontend/UIux%20Design/screenshots/21-admin-hotel-approvals.png)

**Revenue report**
![Revenue report](frontend/UIux%20Design/screenshots/26-report-revenue.png)

#### Complete screenshot list

| # | Screen | Path |
|---|--------|------|
| 01 | Public home | `frontend/UIux Design/screenshots/01-public-home.png` |
| 02 | Hotels list | `.../02-public-hotels.png` |
| 03 | Hotel details | `.../03-public-hotel-details.png` |
| 04 | Venue booking | `.../04-public-venue-details-booking.png` |
| 05 | Contact | `.../05-public-contact.png` |
| 06 | Login | `.../06-public-login.png` |
| 07 | Signup | `.../07-public-signup.png` |
| 08–11 | Customer portal | dashboard, bookings, appointments, profile |
| 12–17 | Owner portal | dashboard, hotel, halls, forms, bookings |
| 18–19 | Owner popups | schedule visit, confirm booking |
| 20–24 | Admin portal | dashboard, approvals, reject popup, venues, reports hub |
| 25–27 | Admin reports | operations, revenue, performance |

#### Suggested demo flow (for marking)

1. Register as **hotel owner** → create hotel profile  
2. Login as **admin** → approve hotel  
3. Owner adds halls (images, capacity, price)  
4. Register as **customer** → book a hall  
5. Owner: accept → schedule visit → confirm deposit  
6. Customer: My Bookings → print invoice  
7. Owner: open **Hotel Report**  
8. Admin: open Operations / Revenue / Performance reports  


