// Simple symbol -> CoinGecko id mapping for popular coins.
// Extend as needed. Unknown symbols will be skipped gracefully.
const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  ZEC: 'zcash',
  SOL: 'solana',
  ADA: 'cardano',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  MATIC: 'matic-network',
  BNB: 'binancecoin',
  LTC: 'litecoin',
}

export async function fetchInrPricesForSymbols(symbols) {
  const unique = [...new Set(symbols.map((s) => String(s).toUpperCase()))]
  const ids = unique.map((s) => COINGECKO_IDS[s]).filter(Boolean)
  if (ids.length === 0) return {}
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=inr`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Network')
    const data = await res.json()
    const out = {}
    for (const sym of unique) {
      const id = COINGECKO_IDS[sym]
      if (id && data[id]?.inr != null) out[sym] = Number(data[id].inr)
    }
    return out
  } catch {
    return {}
  }
}

// CoinDCX INR fetch (market last_price) — tries markets like BTCINR, ETHINR, etc.
export async function fetchInrPricesFromCoinDCX(symbols) {
  const unique = [...new Set(symbols.map((s) => String(s).toUpperCase()))]
  if (!unique.length) return {}
  try {
    const res = await fetch('https://api.coindcx.com/exchange/ticker')
    if (!res.ok) throw new Error('Network')
    const list = await res.json()
    const byMarket = {}
    for (const t of list) {
      if (t.market && t.last_price != null) byMarket[t.market.toUpperCase()] = Number(t.last_price)
    }
    const out = {}
    for (const sym of unique) {
      const market = `${sym}INR`
      if (byMarket[market] != null) out[sym] = byMarket[market]
    }
    return out
  } catch {
    return {}
  }
}

// Combined: prefer CoinDCX, fall back to CoinGecko
export async function fetchInrPricesPreferCoinDCX(symbols) {
  const a = await fetchInrPricesFromCoinDCX(symbols)
  const missing = symbols.filter((s) => a[String(s).toUpperCase()] == null)
  if (missing.length) {
    const b = await fetchInrPricesForSymbols(missing)
    return { ...a, ...b }
  }
  return a
}

