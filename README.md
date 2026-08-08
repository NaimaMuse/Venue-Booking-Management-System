\# Hargeisa Hall Finder



\## Venue Booking Management System



\### 1. Project Title and Purpose



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

\### 2. Team Members with Assigned Roles



| Name | Role | Responsibilities |

|------|------|------------------|

| \*\*Naima Muse\*\* | Frontend Lead | Public pages, customer portal, React routing, UI integration |

| \*\*Rahma Mukhtar\*\* | Backend Lead | Express API, MongoDB models, JWT auth, booking workflow, owner/admin reports |

| \*\*Naima\*\* | UI/UX Designer | Visual design system, page layouts, screenshots \& design documentation |

| \*\*Abdiasis\*\* | Full-Stack Developer | Owner portal features, halls CRUD, booking request handling |

| \*\*Abdiqani\*\* | Full-Stack Developer | Admin portal, hotel approvals, venues directory, analytics reports |

| \*\*Sahal\*\* | QA \& Documentation | Testing flows, README/environment docs, demo preparation |



\---

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



\---



\### 4. Installation Instructions



\#### Prerequisites



\- Node.js \*\*18+\*\* and npm  

\- MongoDB running locally (or a MongoDB Atlas URI)  

\- Modern browser (Chrome / Edge / Firefox)



\#### Setup



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







