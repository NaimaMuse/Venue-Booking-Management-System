# HallHub

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)

A full-stack **MERN** venue booking platform for hotels and banquet halls in Hargeisa.

**Institution:** Telesom Academy  
**Group leader:** Naima Muse Ahmed

Customers browse approved hotels and halls, request bookings, and track visits. Hotel owners list venues after admin approval, then manage halls, media, and booking requests. Admins verify hotels and review platform reports.

---

## Table of contents

- [Team](#team)
- [Features](#features)
- [Tech stack](#tech-stack)
- [User roles](#user-roles)
- [Core flows](#core-flows)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Frontend routes](#frontend-routes)
- [API overview](#api-overview)
- [Booking statuses](#booking-statuses)
- [Railway deployment](#railway-deployment)
- [License](#license)

---

## Team

| No. | Full name | Role |
|-----|-----------|------|
| 1 | Naima Muse Ahmed | Backend and integration *(Group leader)* |
| 2 | Abdicasiis Mohamed Ibraahim | Frontend |
| 3 | Naima Abdulkarim Mohamed | Frontend |
| 4 | Rahma Mokhtar | Frontend |
| 5 | Sahal Khaliif Mohamed | UI/UX design |
| 6 | Abdiqani Abdulahi Hassan | Documentation |

### Role summary

**Frontend**  
Abdicasiis Mohamed Ibraahim, Rahma Mokhtar, and Naima Abdulkarim Mohamed. Public website, customer portal, owner portal, and admin interface.

**UI/UX design**  
Sahal Khaliif Mohamed. Layout, visual design, and user experience.

**Backend and integration**  
Naima Muse Ahmed (group leader). API, database, authentication, and frontend–backend integration.

**Documentation**  
Abdiqani Abdulahi Hassan. Project documentation and written reports.

---

## Features

### Public website

- Home, services, about, and contact pages
- Search hotels and halls by name, city, capacity, and price
- Hotel pages with listed halls
- Hall details with photo gallery and optional owner video
- Booking form that guests can fill before creating an account

### Customer

- Register / log in as a customer
- Submit booking requests
- View bookings and visit appointments
- Download a booking invoice after deposit confirmation
- Manage profile

### Hotel owner

- Register with hotel details (creates a pending hotel application)
- Wait for admin approval before opening the owner dashboard
- Edit hotel profile
- Create, update, and delete halls
- Upload up to 5 hall images and 1 hall video
- Accept, reject, confirm, or cancel bookings
- Schedule customer visits
- View owner reports

### Admin

- Review pending hotel applications
- Approve, reject, or set hotels back to pending
- Browse all hotels, halls, and platform reports
- View operations, revenue, and performance reports

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Node.js 18+, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Uploads | Multer (hall images and video) |
| Charts | Recharts |

---

## User roles

| Role | Who it is | Access |
|------|-----------|--------|
| `customer` | Person booking a hall | Customer dashboard |
| `hotel_owner` | Hotel / hall owner | Owner dashboard after hotel approval |
| `admin` | Platform administrator | Admin dashboard |

Public signup supports `customer` and `hotel_owner`. An admin can be created with `npm run seed:admin` in `backend`.

---

## Core flows

### Hotel owner approval

1. Owner signs up and submits hotel details.
2. Backend creates a `User` plus a `Hotel` with `verificationStatus: pending`.
3. Owner sees a waiting screen and cannot use the dashboard yet.
4. Admin approves the hotel in **Hotel Approvals**.
5. Owner refreshes (or the page auto-checks) and enters the dashboard.

### Guest booking

1. Guest fills event date, guests, and notes on the hall page.
2. Submit saves a booking draft and redirects to **signup**.
3. After customer signup (or login), the booking is submitted automatically.
4. Customer lands on **My Bookings**.

Logout returns to the homepage.

---

## Project structure

```text
Venue-Booking-Management-System/
├── backend/
│   ├── config/                 # MongoDB connection
│   ├── controllers/            # Auth, hotels, halls, bookings, reports
│   ├── middleware/             # JWT auth + hall media uploads
│   ├── models/                 # User, Hotel, Hall, Booking
│   ├── routes/                 # API routers
│   ├── uploads/halls/          # Uploaded hall images and videos
│   ├── railway.json            # Railway backend config
│   ├── seedAdmin.js            # Create / promote admin user
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── public website/
│   │   │   ├── customer/
│   │   │   ├── owner/
│   │   │   └── admin/
│   │   └── utils/
│   ├── railway.json            # Railway frontend config
│   └── .env.example
└── README.md
