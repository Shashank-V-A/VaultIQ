import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { getDecryptedCoindcxKeys } from './settings.js'
import { fetchAllTradeHistory, mapCoinDcxTrade, coindcxRequest } from '../services/coindcx.js'

const router = Router()

router.get('/status', requireAuth, async (req, res) => {
  try {
    const keys = await getDecryptedCoindcxKeys(req.user.id)
    const settings = await pool.query(
      `SELECT coindcx_connected, coindcx_last_sync, coindcx_last_trade_id FROM user_settings WHERE user_id = $1`,
      [req.user.id]
    )
    const row = settings.rows[0] || {}
    res.json({
      connected: Boolean(keys?.connected),
      lastSync: row.coindcx_last_sync || null,
      lastTradeId: row.coindcx_last_trade_id || null,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load CoinDCX status' })
  }
})

router.post('/test', requireAuth, async (req, res) => {
  try {
    const keys = await getDecryptedCoindcxKeys(req.user.id)
    if (!keys) return res.status(400).json({ error: 'Connect CoinDCX API keys first' })
    // Lightweight authenticated call
    await coindcxRequest(keys.apiKey, keys.apiSecret, '/exchange/v1/users/balances', {})
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: error.message || 'CoinDCX connection failed' })
  }
})

router.post('/sync', requireAuth, async (req, res) => {
  try {
    const keys = await getDecryptedCoindcxKeys(req.user.id)
    if (!keys) {
      return res.status(400).json({ error: 'Connect CoinDCX API keys in Settings first' })
    }

    const fromId = keys.lastTradeId ? Number(keys.lastTradeId) : null
    const trades = await fetchAllTradeHistory(keys.apiKey, keys.apiSecret, {
      fromId: fromId ? fromId : null,
    })

    let imported = 0
    let skipped = 0
    let maxTradeId = keys.lastTradeId ? Number(keys.lastTradeId) : 0

    for (const trade of trades) {
      const mapped = mapCoinDcxTrade(trade)
      if (!mapped) {
        skipped += 1
        continue
      }
      if (mapped.tradeId > maxTradeId) maxTradeId = mapped.tradeId

      const result = await pool.query(
        `INSERT INTO transactions
          (user_id, date, symbol, type, quantity, price, fee_exchange, fee_gst, tds, notes, source, external_id, market)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'coindcx',$11,$12)
         ON CONFLICT (user_id, external_id)
         DO NOTHING
         RETURNING id`,
        [
          req.user.id,
          mapped.date,
          mapped.symbol,
          mapped.type,
          mapped.quantity,
          mapped.price,
          mapped.feeExchange,
          mapped.feeGst,
          mapped.tds,
          mapped.notes,
          mapped.externalId,
          mapped.market,
        ]
      )
      if (result.rowCount) imported += 1
      else skipped += 1
    }

    await pool.query(
      `UPDATE user_settings SET
        coindcx_last_sync = NOW(),
        coindcx_last_trade_id = $1,
        coindcx_connected = TRUE,
        updated_at = NOW()
       WHERE user_id = $2`,
      [maxTradeId || null, req.user.id]
    )

    res.json({
      success: true,
      fetched: trades.length,
      imported,
      skipped,
      lastTradeId: maxTradeId || null,
    })
  } catch (error) {
    console.error('CoinDCX sync error:', error)
    res.status(500).json({ error: error.message || 'Sync failed' })
  }
})

export default router
