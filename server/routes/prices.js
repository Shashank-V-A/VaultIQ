import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT symbol, price FROM prices WHERE user_id = $1`,
      [req.user.id]
    )
    const prices = {}
    for (const row of result.rows) {
      prices[row.symbol] = Number(row.price)
    }
    res.json({ prices })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load prices' })
  }
})

router.put('/', requireAuth, async (req, res) => {
  try {
    const prices = req.body.prices
    if (!prices || typeof prices !== 'object') {
      return res.status(400).json({ error: 'prices object required' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const [symbol, price] of Object.entries(prices)) {
        await client.query(
          `INSERT INTO prices (user_id, symbol, price, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, symbol)
           DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()`,
          [req.user.id, String(symbol).toUpperCase(), Number(price)]
        )
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save prices' })
  }
})

router.put('/:symbol', requireAuth, async (req, res) => {
  try {
    const symbol = String(req.params.symbol).toUpperCase()
    const price = Number(req.body.price)
    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Valid price required' })
    }
    await pool.query(
      `INSERT INTO prices (user_id, symbol, price, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, symbol)
       DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()`,
      [req.user.id, symbol, price]
    )
    res.json({ success: true, symbol, price })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update price' })
  }
})

export default router
