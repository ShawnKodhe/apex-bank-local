# Apex Bank

Self-hosted finance app for sending money via crypto, Visa card, and M-Pesa. This version runs entirely on your own server.

## Stack

- **Frontend:** React, Vite, Tailwind, shadcn/ui
- **Backend:** Node.js 22.5+, Express, SQLite (built-in `node:sqlite` — no native build tools)
- **Auth:** JWT (email + password)

**Node.js:** Use **v22.5 or newer** (LTS recommended). The server does not use `better-sqlite3`, so you avoid “compiled against a different Node.js version” errors when upgrading Node.

## Quick start (development)

### 1. Install dependencies

```bash
npm install
cd server && npm install && cd ..
```

### 2. Configure the API (optional)

```bash
cp .env.example server/.env
# Edit server/.env — set JWT_SECRET and admin credentials
```

### 3. Run backend and frontend

Terminal 1 — API:

```bash
cd server
npm run dev
```

Terminal 2 — UI (proxies `/api` to port 3001):

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Default admin:** `admin@apexbank.local` / `admin123` (change in `server/.env` before production).

Register a normal user via **Create account**, then use the app.

## Production deployment

### Build the frontend

```bash
npm run build
```

### Run the server (serves API + static `dist/`)

```bash
cd server
NODE_ENV=production node index.js
```

Set environment variables:

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `3001`) |
| `JWT_SECRET` | Required — long random string |
| `ADMIN_EMAIL` | Initial admin login |
| `ADMIN_PASSWORD` | Initial admin password |
| `DATABASE_PATH` | SQLite file path |

Data is stored under `server/data/` (database + uploaded KYC files). Back up this folder regularly.

### Reverse proxy (recommended)

Put Nginx or Caddy in front of the Node process:

- Serve HTTPS
- Proxy `https://yourdomain.com` → `http://127.0.0.1:3001`
- Set `client_max_body_size` to at least `10m` for KYC uploads

### Docker (optional)

You can wrap `server/` with a Dockerfile that runs `npm run build` in the parent folder, then `node server/index.js`. Mount `server/data` as a volume for persistence.

## Features

- User registration and login
- Wallets (PayPal, Stripe, M-Pesa, BTC, ETH, USDT)
- Deposits, withdrawals, P2P transfers
- Send money: NexBank users, M-Pesa, crypto, Visa
- KYC submission and admin review
- Real-time incoming transfer notifications (SSE)

## Project layout

```
├── src/           React frontend
├── server/        Express API + SQLite
│   ├── data/      Database and uploads (created at runtime)
│   └── routes/
└── dist/          Production build (after npm run build)
```

## Migrating from Base44

This repo no longer uses `@base44/sdk` or Base44 hosting. Environment variables `VITE_BASE44_*` are not required. All data lives in your SQLite database on your server.
