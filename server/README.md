# VaultIQ API Server

Node.js/Express API server for PostgreSQL storage.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3001
NODE_ENV=production
```

3. Start server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/data/:userId` - Get user data
- `POST /api/data/:userId` - Save user data
- `POST /api/transactions/:userId` - Save transactions
- `POST /api/prices/:userId` - Save prices

## Deployment

### Railway
- Connect GitHub repo
- Set root directory to `server/`
- Add `DATABASE_URL` environment variable
- Auto-deploys on push

### Render
- Connect GitHub repo
- Build command: `cd server && npm install`
- Start command: `cd server && npm start`
- Add `DATABASE_URL` environment variable

### Vercel
- Add `vercel.json`:
```json
{
  "builds": [{ "src": "server/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server/index.js" }]
}
```

