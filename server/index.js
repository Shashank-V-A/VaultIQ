import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { initDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import priceRoutes from './routes/prices.js'
import settingsRoutes from './routes/settings.js'
import coindcxRoutes from './routes/coindcx.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'VaultIQ API',
    version: '2.0.0',
  })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/prices', priceRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/coindcx', coindcxRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

async function start() {
  try {
    await initDatabase()
    app.listen(PORT, () => {
      console.log(`VaultIQ API running on http://localhost:${PORT}`)
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn('⚠️  Google OAuth credentials not set — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET')
      }
      if (!process.env.JWT_SECRET) {
        console.warn('⚠️  JWT_SECRET not set')
      }
      if (!process.env.ENCRYPTION_KEY) {
        console.warn('⚠️  ENCRYPTION_KEY not set (required for CoinDCX key storage)')
      }
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
