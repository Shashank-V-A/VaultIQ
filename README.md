# VaultIQ

Multi-user crypto portfolio & Indian VDA tax tracker.

## Stack

- **Frontend:** React + Vite + Tailwind
- **Backend:** Express + PostgreSQL
- **Auth:** Google OAuth (cookie JWT)
- **Exchange:** CoinDCX authenticated trade history sync

## Setup

### 1. Database

Easiest with Docker Desktop running:

```bash
docker compose up -d
```

Or point `DATABASE_URL` at any Postgres 14+ instance and create a `vaultiq` database.

### 2. Server env

Copy `server/.env.example` → `server/.env` and fill:

```
DATABASE_URL=postgresql://USER:PASS@localhost:5432/vaultiq
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
JWT_SECRET=long-random-string
ENCRYPTION_KEY=another-long-random-string-32+
```

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

- Create an OAuth 2.0 Client (Web)
- Authorized JavaScript origins: `http://localhost:5173`
- Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback`

### 3. Run

```bash
# terminal 1
cd server && npm install && npm run dev

# terminal 2
npm install && npm run dev
```

Open http://localhost:5173

### CoinDCX

In Settings, paste API key + secret (encrypted at rest). Use **Sync CoinDCX** to import INR spot trades. Manual logging still works alongside imports.

## Tax engine

Aligned with Income-tax Act 2025 / erstwhile §115BBH & §194S:

- 30% on **positive** VDA gains only (FIFO)
- Losses are **not** set off and not carried forward
- Surcharge (optional) + 4% cess
- TDS thresholds ₹50k / ₹10k by person type
