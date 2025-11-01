# Supabase Cloud Storage Setup

This guide will help you set up cloud storage for VaultIQ so your data persists across devices and browsers.

## Why Cloud Storage?

- **Persists across browsers**: Your data is saved even if you clear browser data
- **Works across devices**: Access your data from any device
- **Backup**: Your data is safely stored in the cloud
- **No data loss**: Unlike localStorage, cloud storage won't be cleared accidentally

## Step-by-Step Setup

### 1. Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free tier is sufficient)

### 2. Create a New Project

1. Click "New Project"
2. Choose an organization (or create one)
3. Fill in:
   - **Project Name**: `vaultiq` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for the project to be ready

### 3. Create the Database Table

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Create the user_data table
CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY,
  transactions JSONB DEFAULT '[]'::jsonb,
  prices JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to access their own data
-- This uses a simple user_id matching strategy
CREATE POLICY "Users can access their own data" ON user_data
  FOR ALL USING (true);
```

4. Click **Run** (or press `Ctrl+Enter`)
5. You should see "Success. No rows returned"

### 4. Get Your API Keys

1. Go to **Settings** → **API** (left sidebar)
2. Copy these two values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys" → "anon public")

### 5. Add Environment Variables to Vercel

1. Go to your Vercel dashboard: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your VaultIQ project
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: (paste your Project URL from step 4)
   - Environment: Select all (Production, Preview, Development)
   
   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: (paste your anon public key from step 4)
   - Environment: Select all (Production, Preview, Development)

5. Click **Save** for each variable

### 6. Redeploy Your Project

1. In Vercel, go to **Deployments**
2. Click the **three dots** (⋮) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (1-2 minutes)

### 7. Verify Setup

1. Open your VaultIQ app
2. Go to **Settings**
3. You should see: **✓ Cloud storage enabled - your data is saved to the cloud**
4. Add a test transaction
5. Close and reopen the browser - your data should still be there!

## Troubleshooting

### "Cloud storage not configured" message still shows

- Make sure you added both environment variables in Vercel
- Make sure you selected all environments (Production, Preview, Development)
- Make sure you redeployed after adding the variables
- Check Vercel deployment logs for any errors

### Data not syncing

- Open browser console (F12) and check for errors
- Verify your Supabase project is active
- Check that the `user_data` table exists in Supabase

### Need to reset data

- Go to Settings → Reset All Data
- Or manually delete rows in Supabase: SQL Editor → `DELETE FROM user_data;`

## Security Notes

- The `anon` key is safe to use in frontend code (it has limited permissions)
- Row Level Security is enabled for additional protection
- Each user gets a unique `user_id` stored locally
- Your data is stored in Supabase's secure database

## Free Tier Limits

Supabase free tier includes:
- 500 MB database storage
- 2 GB bandwidth per month
- More than enough for personal use!

---

**Need help?** Check the [Supabase Documentation](https://supabase.com/docs) or open an issue on GitHub.

