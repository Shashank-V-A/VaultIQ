import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function rowToTx(row) {
  return {
    id: row.id,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
    symbol: row.symbol,
    type: row.type,
    quantity: Number(row.quantity),
    price: Number(row.price),
    feeExchange: Number(row.fee_exchange || 0),
    feeGst: Number(row.fee_gst || 0),
    tds: Number(row.tds || 0),
    notes: row.notes || '',
    source: row.source,
    externalId: row.external_id,
    market: row.market,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY date ASC, created_at ASC`,
      [req.user.id]
    )
    res.json({ transactions: result.rows.map(rowToTx) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load transactions' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      date,
      symbol,
      type,
      quantity,
      price,
      feeExchange = 0,
      feeGst = 0,
      tds = 0,
      notes = '',
    } = req.body

    if (!date || !symbol || !type || quantity == null || price == null) {
      return res.status(400).json({ error: 'date, symbol, type, quantity, and price are required' })
    }
    if (!['BUY', 'SELL'].includes(type)) {
      return res.status(400).json({ error: 'type must be BUY or SELL' })
    }

    const result = await pool.query(
      `INSERT INTO transactions
        (user_id, date, symbol, type, quantity, price, fee_exchange, fee_gst, tds, notes, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'manual')
       RETURNING *`,
      [
        req.user.id,
        date,
        String(symbol).toUpperCase(),
        type,
        Number(quantity),
        Number(price),
        Number(feeExchange) || 0,
        Number(feeGst) || 0,
        Number(tds) || 0,
        notes || null,
      ]
    )
    res.status(201).json({ transaction: rowToTx(result.rows[0]) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create transaction' })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const {
      date,
      symbol,
      type,
      quantity,
      price,
      feeExchange = 0,
      feeGst = 0,
      tds = 0,
      notes = '',
    } = req.body

    const result = await pool.query(
      `UPDATE transactions SET
        date = COALESCE($1, date),
        symbol = COALESCE($2, symbol),
        type = COALESCE($3, type),
        quantity = COALESCE($4, quantity),
        price = COALESCE($5, price),
        fee_exchange = COALESCE($6, fee_exchange),
        fee_gst = COALESCE($7, fee_gst),
        tds = COALESCE($8, tds),
        notes = $9,
        updated_at = NOW()
       WHERE id = $10 AND user_id = $11 AND source = 'manual'
       RETURNING *`,
      [
        date || null,
        symbol ? String(symbol).toUpperCase() : null,
        type || null,
        quantity != null ? Number(quantity) : null,
        price != null ? Number(price) : null,
        Number(feeExchange) || 0,
        Number(feeGst) || 0,
        Number(tds) || 0,
        notes || null,
        req.params.id,
        req.user.id,
      ]
    )

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Transaction not found or not editable (CoinDCX imports are read-only)' })
    }
    res.json({ transaction: rowToTx(result.rows[0]) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update transaction' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    )
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Transaction not found' })
    }
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete transaction' })
  }
})

router.post('/bulk-delete', requireAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : []
    if (!ids.length) return res.status(400).json({ error: 'ids required' })
    const result = await pool.query(
      `DELETE FROM transactions WHERE user_id = $1 AND id = ANY($2::uuid[]) RETURNING id`,
      [req.user.id, ids]
    )
    res.json({ deleted: result.rowCount })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete transactions' })
  }
})

export default router
