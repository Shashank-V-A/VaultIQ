// Simple Express API server for PostgreSQL storage
import express from 'express'
import cors from 'cors'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// PostgreSQL connection pool
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Create table if it doesn't exist
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id TEXT PRIMARY KEY,
        transactions JSONB DEFAULT '[]'::jsonb,
        prices JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    console.log('Database table ready')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

initDatabase()

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Get user data
app.get('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const result = await pool.query(
      'SELECT transactions, prices FROM user_data WHERE user_id = $1',
      [userId]
    )
    
    if (result.rows.length === 0) {
      return res.json({ transactions: [], prices: {} })
    }
    
    res.json({
      transactions: result.rows[0].transactions || [],
      prices: result.rows[0].prices || {}
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ error: 'Failed to fetch data' })
  }
})

// Save user data
app.post('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { transactions, prices } = req.body
    
    await pool.query(
      `INSERT INTO user_data (user_id, transactions, prices, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         transactions = EXCLUDED.transactions,
         prices = EXCLUDED.prices,
         updated_at = NOW()`,
      [userId, JSON.stringify(transactions || []), JSON.stringify(prices || {})]
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error saving data:', error)
    res.status(500).json({ error: 'Failed to save data' })
  }
})

// Save transactions only
app.post('/api/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { transactions } = req.body
    
    await pool.query(
      `INSERT INTO user_data (user_id, transactions, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         transactions = EXCLUDED.transactions,
         updated_at = NOW()`,
      [userId, JSON.stringify(transactions || [])]
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error saving transactions:', error)
    res.status(500).json({ error: 'Failed to save transactions' })
  }
})

// Save prices only
app.post('/api/prices/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { prices } = req.body
    
    await pool.query(
      `INSERT INTO user_data (user_id, prices, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         prices = EXCLUDED.prices,
         updated_at = NOW()`,
      [userId, JSON.stringify(prices || {})]
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error saving prices:', error)
    res.status(500).json({ error: 'Failed to save prices' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

