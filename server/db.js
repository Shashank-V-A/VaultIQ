import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function initDatabase() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      currency TEXT NOT NULL DEFAULT 'INR',
      auto_prices BOOLEAN NOT NULL DEFAULT TRUE,
      tds_person_type TEXT NOT NULL DEFAULT 'specified',
      surcharge_rate NUMERIC NOT NULL DEFAULT 0,
      coindcx_api_key_enc TEXT,
      coindcx_api_secret_enc TEXT,
      coindcx_connected BOOLEAN NOT NULL DEFAULT FALSE,
      coindcx_last_sync TIMESTAMPTZ,
      coindcx_last_trade_id BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      symbol TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
      quantity NUMERIC NOT NULL CHECK (quantity > 0),
      price NUMERIC NOT NULL CHECK (price >= 0),
      fee_exchange NUMERIC NOT NULL DEFAULT 0,
      fee_gst NUMERIC NOT NULL DEFAULT 0,
      tds NUMERIC NOT NULL DEFAULT 0,
      notes TEXT,
      source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'coindcx')),
      external_id TEXT,
      market TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, external_id)
    );

    CREATE INDEX IF NOT EXISTS transactions_user_date_idx
      ON transactions(user_id, date DESC);

    CREATE TABLE IF NOT EXISTS prices (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      price NUMERIC NOT NULL CHECK (price >= 0),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, symbol)
    );
  `)

  // Migrate legacy blob table if present (optional, non-destructive)
  console.log('Database schema ready')
}

export async function ensureUserSettings(userId) {
  await pool.query(
    `INSERT INTO user_settings (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  )
}
