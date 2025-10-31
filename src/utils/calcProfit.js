// Transactions schema:
// { id, date: 'YYYY-MM-DD', symbol, type: 'BUY'|'SELL', quantity: number, price: number,
//   fee?: number, feeExchange?: number, feeGst?: number, tds?: number }

function sortByDateAsc(transactions) {
  return [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
}

export function groupBySymbol(transactions) {
  return transactions.reduce((acc, t) => {
    const key = t.symbol.toUpperCase()
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})
}

// FIFO profit engine per symbol
export function computePerSymbolStats(transactions, currentPrices = {}) {
  const groups = groupBySymbol(transactions)
  const result = {}

  for (const symbol of Object.keys(groups)) {
    const txs = sortByDateAsc(groups[symbol])
    const lots = [] // { qtyRemaining, costPerUnit }
    let realized = 0
    let totalInvested = 0
    let totalFees = 0

    for (const t of txs) {
      const qty = Number(t.quantity)
      const totalAmount = Number(t.price) // user-entered total amount including fees
      if (t.type === 'BUY') {
        const totalCost = totalAmount
        const unitCost = totalCost / qty
        lots.push({ qtyRemaining: qty, costPerUnit: unitCost })
        totalInvested += totalCost
        // fees are informational only; price already includes them
      } else if (t.type === 'SELL') {
        let qtyToSell = qty
        let proceeds = totalAmount
        // Deplete FIFO lots
        let costBasis = 0
        while (qtyToSell > 0 && lots.length > 0) {
          const lot = lots[0]
          const used = Math.min(lot.qtyRemaining, qtyToSell)
          costBasis += used * lot.costPerUnit
          lot.qtyRemaining -= used
          qtyToSell -= used
          if (lot.qtyRemaining <= 0.00000001) {
            lots.shift()
          }
        }
        // If selling more than holdings, remaining is treated as no cost basis
        realized += proceeds - costBasis
      }
    }

    const holdingQty = lots.reduce((s, l) => s + l.qtyRemaining, 0)
    const holdingCost = lots.reduce((s, l) => s + l.qtyRemaining * l.costPerUnit, 0)
    const avgBuyPrice = holdingQty > 0 ? holdingCost / holdingQty : 0
    const currentPrice = Number(currentPrices[symbol] || 0)
    const currentValue = holdingQty * currentPrice
    const unrealized = currentValue - holdingCost

    result[symbol] = {
      lots,
      holdingQty,
      holdingCost,
      avgBuyPrice,
      realized,
      unrealized,
      currentPrice,
      currentValue,
      totalInvested,
      totalFees,
    }
  }

  return result
}

export function computePortfolioTotals(perSymbol) {
  let totalInvested = 0
  let totalCurrentValue = 0
  let totalRealized = 0
  let totalUnrealized = 0

  for (const s of Object.keys(perSymbol)) {
    const v = perSymbol[s]
    totalInvested += v.holdingCost + (v.realized > 0 ? 0 : 0) // invested counts current holding costs
    totalCurrentValue += v.currentValue
    totalRealized += v.realized
    totalUnrealized += v.unrealized
  }

  return {
    totalInvested,
    totalCurrentValue,
    totalRealized,
    totalUnrealized,
  }
}

export function filterTransactions(transactions, { symbol = '', from = '', to = '' } = {}) {
  const s = symbol.trim().toUpperCase()
  const fromDate = from ? new Date(from) : null
  const toDate = to ? new Date(to) : null
  return transactions.filter((t) => {
    const tDate = new Date(t.date)
    const symbolOk = s ? t.symbol.toUpperCase().includes(s) : true
    const fromOk = fromDate ? tDate >= fromDate : true
    const toOk = toDate ? tDate <= toDate : true
    return symbolOk && fromOk && toOk
  })
}

