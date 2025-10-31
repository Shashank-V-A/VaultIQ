export function getCoinIconUrl(symbol) {
  if (!symbol) return ''
  const s = String(symbol).toLowerCase()
  // Try common CDN sources; first one usually sufficient
  return `https://assets.coincap.io/assets/icons/${s}@2x.png`
}

