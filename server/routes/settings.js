import { Router } from 'express'
import { pool, ensureUserSettings } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { encrypt, decrypt } from '../utils/encrypt.js'

const router = Router()

function mapSettings(row) {
  return {
    currency: row.currency,
    autoPrices: row.auto_prices,
    tdsPersonType: row.tds_person_type,
    surchargeRate: Number(row.surcharge_rate || 0),
    coindcxConnected: Boolean(row.coindcx_connected),
    coindcxLastSync: row.coindcx_last_sync,
    hasCoindcxKeys: Boolean(row.coindcx_api_key_enc && row.coindcx_api_secret_enc),
  }
}

router.get('/', requireAuth, async (req, res) => {
  try {
    await ensureUserSettings(req.user.id)
    const result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id])
    res.json({ settings: mapSettings(result.rows[0]) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load settings' })
  }
})

router.put('/', requireAuth, async (req, res) => {
  try {
    await ensureUserSettings(req.user.id)
    const {
      currency,
      autoPrices,
      tdsPersonType,
      surchargeRate,
    } = req.body

    const result = await pool.query(
      `UPDATE user_settings SET
        currency = COALESCE($1, currency),
        auto_prices = COALESCE($2, auto_prices),
        tds_person_type = COALESCE($3, tds_person_type),
        surcharge_rate = COALESCE($4, surcharge_rate),
        updated_at = NOW()
       WHERE user_id = $5
       RETURNING *`,
      [
        currency || null,
        typeof autoPrices === 'boolean' ? autoPrices : null,
        tdsPersonType || null,
        surchargeRate != null ? Number(surchargeRate) : null,
        req.user.id,
      ]
    )
    res.json({ settings: mapSettings(result.rows[0]) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

router.post('/coindcx', requireAuth, async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'apiKey and apiSecret are required' })
    }
    await ensureUserSettings(req.user.id)
    await pool.query(
      `UPDATE user_settings SET
        coindcx_api_key_enc = $1,
        coindcx_api_secret_enc = $2,
        coindcx_connected = TRUE,
        updated_at = NOW()
       WHERE user_id = $3`,
      [encrypt(apiKey), encrypt(apiSecret), req.user.id]
    )
    res.json({ success: true, connected: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || 'Failed to save CoinDCX credentials' })
  }
})

router.delete('/coindcx', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE user_settings SET
        coindcx_api_key_enc = NULL,
        coindcx_api_secret_enc = NULL,
        coindcx_connected = FALSE,
        coindcx_last_sync = NULL,
        coindcx_last_trade_id = NULL,
        updated_at = NOW()
       WHERE user_id = $1`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to disconnect CoinDCX' })
  }
})

export async function getDecryptedCoindcxKeys(userId) {
  const result = await pool.query(
    `SELECT coindcx_api_key_enc, coindcx_api_secret_enc, coindcx_last_trade_id, coindcx_connected
     FROM user_settings WHERE user_id = $1`,
    [userId]
  )
  const row = result.rows[0]
  if (!row?.coindcx_api_key_enc || !row?.coindcx_api_secret_enc) {
    return null
  }
  return {
    apiKey: decrypt(row.coindcx_api_key_enc),
    apiSecret: decrypt(row.coindcx_api_secret_enc),
    lastTradeId: row.coindcx_last_trade_id,
    connected: row.coindcx_connected,
  }
}

export default router
