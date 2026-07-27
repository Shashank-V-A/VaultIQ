import crypto from 'crypto'

const BASE = 'https://api.coindcx.com'

function signBody(secret, body) {
  const json = JSON.stringify(body)
  const signature = crypto.createHmac('sha256', secret).update(json).digest('hex')
  return { json, signature }
}

export async function coindcxRequest(apiKey, apiSecret, path, body = {}) {
  const payload = {
    ...body,
    timestamp: Date.now(),
  }
  const { json, signature } = signBody(apiSecret, payload)
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-APIKEY': apiKey,
      'X-AUTH-SIGNATURE': signature,
    },
    body: json,
  })

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const message = typeof data === 'object' && data?.message
      ? data.message
      : `CoinDCX API error (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

/**
 * Parse CoinDCX market symbol into base asset for INR pairs.
 * Examples: BTCINR -> BTC, ETHUSDT -> ETH (quote USDT), SNTBTC -> SNT
 */
export function parseMarketSymbol(symbol) {
  const s = String(symbol || '').toUpperCase()
  const quotes = ['INR', 'USDT', 'USDC', 'BTC', 'ETH', 'BNB']
  for (const q of quotes) {
    if (s.endsWith(q) && s.length > q.length) {
      return { base: s.slice(0, -q.length), quote: q, market: s }
    }
  }
  return { base: s, quote: 'INR', market: s }
}

/**
 * Map a CoinDCX trade into VaultIQ transaction fields.
 * Trade price is unit price; we store total consideration as quantity * unit price (INR-ish).
 * Fees are kept separate (not deductible under §115BBH).
 */
export function mapCoinDcxTrade(trade) {
  const { base, quote, market } = parseMarketSymbol(trade.symbol)
  const qty = Number(trade.quantity)
  const unit = Number(trade.price)
  const fee = Number(trade.fee_amount || 0)
  const side = String(trade.side || '').toLowerCase()
  const type = side === 'sell' ? 'SELL' : 'BUY'
  const total = qty * unit
  const ts = Number(trade.timestamp)
  const date = new Date(ts).toISOString().slice(0, 10)

  // Only auto-import INR markets by default for Indian tax bookkeeping
  if (quote !== 'INR') {
    return null
  }

  // Rough TDS estimate for sells above threshold is left to UI/settings; store fee as exchange fee
  return {
    externalId: String(trade.id),
    date,
    symbol: base,
    type,
    quantity: qty,
    price: total,
    feeExchange: fee,
    feeGst: 0,
    tds: 0,
    notes: `CoinDCX ${market} @ ${unit}`,
    source: 'coindcx',
    market,
    tradeId: Number(trade.id),
  }
}

export async function fetchAllTradeHistory(apiKey, apiSecret, { fromId = null, fromTimestamp = null } = {}) {
  const collected = []
  let cursor = fromId
  // Paginate upward by from_id
  for (let i = 0; i < 40; i++) {
    const body = {
      limit: 500,
      sort: 'asc',
    }
    if (cursor != null) body.from_id = Number(cursor)
    if (fromTimestamp != null) body.from_timestamp = Number(fromTimestamp)

    const batch = await coindcxRequest(apiKey, apiSecret, '/exchange/v1/orders/trade_history', body)
    if (!Array.isArray(batch) || batch.length === 0) break
    collected.push(...batch)
    const last = batch[batch.length - 1]
    cursor = last.id
    if (batch.length < 500) break
  }
  return collected
}
