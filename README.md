## QR-based-class-attendace-system
- repo contains my final year project which is a web based attenance solution for 
collecting and managing lecture classes

## Tech Stack

- Backend: Node.js, Express, MySQL
- Frontend: React + Vite

## Prerequisites
How tor run the projecct in your machine 
- Git installed
- Node.js (LTS recommended) and npm
- MySQL Server running locally

## 1) Clone the Repository

```bash
git clone https://github.com/museeskinder/qr-based-class-attendance-system.git
cd qr-based-class-attendance-system
```

## 2) Setup Backend

### Install backend dependencies

```bash
cd backend
npm install
```

### Configure environment variables

Copy the example env file and edit values as needed:

```bash
cp .env.example .env
```

If using Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

If `backend/.env` does not exist, create it before running `npm run dev`.

Important `.env` values:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` for MySQL — **`DB_NAME` must exactly match the database name in MySQL** (e.g. as shown in phpMyAdmin), or run `npm run db:init` to create it from `DB_NAME`.
- `JWT_SECRET` for authentication
- `CLIENT_ORIGIN` for frontend URL (set to your frontend port, usually `http://localhost:5173` for Vite)

The backend **does not start** until MySQL accepts a connection to `DB_NAME`. Use `GET /api/health` after a successful start to confirm status.

### Initialize database

Still inside `backend`:

```bash
npm run db:init
npm run db:migrate:names
npm run db:migrate:courses
npm run db:seed:admin
```

### Start backend server

```bash
npm run dev
```

### API smoke test (optional)

With the backend running in another terminal:

```bash
npm run test:e2e
```

Backend should run on `http://localhost:5000` by default.
If MySQL is down or `DB_NAME` does not exist, the process exits with a clear error after the connection check.

## 3) Setup Frontend

Open a new terminal and run:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend should run on `http://localhost:5173` by default.

## 4) Test the App

- Open the frontend URL in your browser.
- Make sure backend is running at the same time.
- Confirm backend CORS `CLIENT_ORIGIN` matches the frontend URL.
- Login with seeded admin credentials from your backend `.env` values (`ADMIN_SEED_USERNAME` and `ADMIN_SEED_PASSWORD`) if needed.

## Common Troubleshooting

- If backend fails to start, verify `.env` exists in `backend` and MySQL credentials are correct.
- If frontend cannot call backend, check `CLIENT_ORIGIN`, backend port, and CORS settings.
- If database scripts fail, confirm MySQL service is running and `DB_NAME` is accessible.
