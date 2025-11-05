# PostgreSQL Setup Guide

This guide will help you set up PostgreSQL storage for VaultIQ so your data persists across devices and browsers.

## Architecture

- **Frontend**: React app (Vercel)
- **Backend API**: Node.js/Express server (`server/`)
- **Database**: PostgreSQL (any provider)

## Quick Setup Options

### Option 1: Railway (Easiest - Free Tier)

1. **Create PostgreSQL Database:**
   - Go to [railway.app](https://railway.app)
   - Sign up (free)
   - Click "New Project" → "Provision PostgreSQL"
   - Copy the connection string (DATABASE_URL)

2. **Deploy API Server:**
   - In Railway, click "New" → "GitHub Repo"
   - Connect your VaultIQ repository
   - Set root directory to `server/`
   - Add environment variable: `DATABASE_URL` = (your PostgreSQL connection string)
   - Railway will auto-deploy
   - Copy the deployed URL (e.g., `https://your-api.railway.app`)

3. **Configure Frontend:**
   - In Vercel, go to Settings → Environment Variables
   - Add: `VITE_API_URL` = (your Railway API URL)
   - Redeploy

### Option 2: Render (Free Tier)

1. **Create PostgreSQL Database:**
   - Go to [render.com](https://render.com)
   - Sign up (free)
   - Create "New PostgreSQL"
   - Copy the "Internal Database URL"

2. **Deploy API Server:**
   - Create "New Web Service"
   - Connect GitHub repo
   - Settings:
     - **Build Command**: `cd server && npm install`
     - **Start Command**: `cd server && npm start`
     - **Environment**: Node
   - Add environment variable: `DATABASE_URL` = (your PostgreSQL URL)
   - Deploy

3. **Configure Frontend:**
   - Copy the Render API URL
   - Add `VITE_API_URL` to Vercel environment variables
   - Redeploy

### Option 3: AWS RDS / Google Cloud SQL / Azure

1. Create PostgreSQL database instance
2. Get connection string
3. Deploy API server to EC2/Cloud Run/App Service
4. Set `DATABASE_URL` environment variable
5. Configure frontend with `VITE_API_URL`

### Option 4: Local Development

1. **Install PostgreSQL:**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql

   # Windows
   # Download from postgresql.org

   # Linux
   sudo apt-get install postgresql
   sudo systemctl start postgresql
   ```

2. **Create Database:**
   ```bash
   createdb vaultiq
   ```

3. **Start API Server:**
   ```bash
   cd server
   npm install
   # Create .env file with:
   # DATABASE_URL=postgresql://postgres:password@localhost:5432/vaultiq
   npm start
   ```

4. **Test API:**
   ```bash
   curl http://localhost:3001/health
   ```

## Database Schema

The API automatically creates the table, but if you need to create it manually:

```sql
CREATE TABLE user_data (
  user_id TEXT PRIMARY KEY,
  transactions JSONB DEFAULT '[]'::jsonb,
  prices JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_data_user_id ON user_data(user_id);
```

## Environment Variables

### Backend API (server/.env)
```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3001
NODE_ENV=production
```

### Frontend (Vercel Environment Variables)
```env
VITE_API_URL=https://your-api-url.com
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/data/:userId` - Get all user data
- `POST /api/data/:userId` - Save all user data
- `POST /api/transactions/:userId` - Save transactions only
- `POST /api/prices/:userId` - Save prices only

## Testing

1. Deploy API server
2. Test health endpoint: `curl https://your-api-url.com/health`
3. Configure frontend with `VITE_API_URL`
4. Open app and go to Settings
5. Should see: "✓ PostgreSQL storage enabled"

## Troubleshooting

### API not connecting
- Check `VITE_API_URL` is set correctly in Vercel
- Verify API server is running and accessible
- Check CORS settings (already configured in server)

### Database connection errors
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Check database is accessible from API server
- Verify firewall rules allow connections

### Data not saving
- Check browser console (F12) for errors
- Verify API server logs
- Test API endpoints with curl/Postman

## Security Notes

- The API uses CORS for frontend access
- User IDs are generated client-side (for demo)
- In production, add authentication (JWT, OAuth, etc.)
- Use HTTPS in production
- Consider adding rate limiting

## Migration from Supabase

If you were using Supabase before:
1. Export your data from Supabase
2. Set up PostgreSQL as above
3. Deploy API server
4. Update frontend with new API URL
5. Data will sync automatically

---

**Need help?** Check the server logs or open an issue on GitHub.

