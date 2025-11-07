// Indian Crypto Tax Calculator
// Based on Union Budget 2022 provisions

/**
 * Calculate 30% tax on crypto profits (as per Indian tax law)
 * @param {number} profit - Net profit from crypto transactions
 * @returns {number} - Tax amount (30% of profit)
 */
export function calculateIncomeTax(profit) {
  if (profit <= 0) return 0
  return profit * 0.30 // 30% flat rate on all crypto gains
}

/**
 * Calculate Health and Education Cess (4% of income tax)
 * @param {number} incomeTax - Income tax amount
 * @returns {number} - Cess amount (4% of tax)
 */
export function calculateCess(incomeTax) {
  if (incomeTax <= 0) return 0
  return incomeTax * 0.04 // 4% cess on income tax
}

/**
 * Calculate total tax liability including cess
 * @param {number} profit - Net profit from crypto transactions
 * @returns {Object} - { tax: income tax, cess: cess amount, total: total tax payable }
 */
export function calculateTotalTax(profit) {
  if (profit <= 0) {
    return { tax: 0, cess: 0, total: 0 }
  }
  const tax = calculateIncomeTax(profit)
  const cess = calculateCess(tax)
  return {
    tax,
    cess,
    total: tax + cess
  }
}

/**
 * Calculate TDS (Tax Deducted at Source) - 1% on transfer value
 * Applicable when transfer value > ₹50,000
 * @param {number} transferValue - Value of the crypto transfer/sale
 * @returns {number} - TDS amount (1% if > ₹50,000, else 0)
 */
export function calculateTDS(transferValue) {
  if (transferValue <= 50000) return 0
  return transferValue * 0.01 // 1% TDS on transfers > ₹50,000
}

/**
 * Calculate tax liability for a financial year
 * @param {Array} transactions - All transactions
 * @param {Object} perSymbol - Per-symbol profit calculations
 * @param {string} financialYear - FY like '2023-24'
 * @returns {Object} - Tax summary
 */
export function calculateTaxLiability(transactions, perSymbol, financialYear = null) {
  // Get financial year from current date if not provided
  if (!financialYear) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    // FY in India: April to March
    const fy = month >= 4 ? `${year}-${String(year + 1).slice(-2)}` : `${year - 1}-${String(year).slice(-2)}`
    financialYear = fy
  }

  // Filter transactions by financial year (April to March)
  const [startYear, endYear] = financialYear.split('-').map(y => parseInt(y))
  const fyStart = new Date(`04-01-20${startYear}`)
  const fyEnd = new Date(`03-31-20${endYear}`)
  
  const fyTransactions = transactions.filter(t => {
    const tDate = new Date(t.date)
    return tDate >= fyStart && tDate <= fyEnd
  })

  // Calculate total realized profit for this financial year only
  // We need to match SELL transactions in this FY against BUY transactions (from any year) using FIFO
  let totalRealizedProfit = 0
  let totalTDS = 0
  let totalGST = 0

  // Get all transactions up to the end of this financial year (for FIFO matching)
  // This ensures BUY transactions from previous years are included for cost basis calculation
  const allTransactionsUpToFYEnd = transactions.filter(t => {
    const tDate = new Date(t.date)
    return tDate <= fyEnd
  })

  // Group all transactions by symbol for FIFO calculation
  const symbolGroups = {}
  allTransactionsUpToFYEnd.forEach(t => {
    const key = t.symbol.toUpperCase()
    if (!symbolGroups[key]) symbolGroups[key] = []
    symbolGroups[key].push(t)
  })

  // Calculate realized profit per symbol for SELL transactions in this FY
  for (const symbol of Object.keys(symbolGroups)) {
    // Get all transactions for this symbol up to FY end, sorted by date
    const symbolTxs = symbolGroups[symbol].sort((a, b) => new Date(a.date) - new Date(b.date))
    const lots = [] // FIFO lots: { qtyRemaining, costPerUnit }
    let symbolRealizedProfit = 0

    // Process all transactions chronologically to build FIFO lots
    for (const t of symbolTxs) {
      const qty = Number(t.quantity)
      const totalAmount = Number(t.price)
      const tDate = new Date(t.date)

      if (t.type === 'BUY') {
        // Add to FIFO lots
        const unitCost = totalAmount / qty
        lots.push({ qtyRemaining: qty, costPerUnit: unitCost })
      } else if (t.type === 'SELL') {
        // Calculate profit using FIFO matching
        let qtyToSell = qty
        let proceeds = totalAmount
        let costBasis = 0

        // Match against FIFO lots
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

        // Only count profit from SELL transactions in this financial year
        if (tDate >= fyStart && tDate <= fyEnd) {
          const profit = proceeds - costBasis
          symbolRealizedProfit += profit

          // Sum TDS and GST from SELL transactions in this FY
          totalTDS += t.tds || 0
          totalGST += t.feeGst || 0
        }
      }
    }

    totalRealizedProfit += symbolRealizedProfit
  }

  // Calculate taxes
  const incomeTax = calculateIncomeTax(totalRealizedProfit)
  const cess = calculateCess(incomeTax)
  const totalTaxWithCess = incomeTax + cess
  const netTaxAfterTDS = Math.max(0, totalTaxWithCess - totalTDS)

  return {
    financialYear,
    totalRealizedProfit,
    incomeTax30Percent: incomeTax,
    cess4Percent: cess,
    totalTaxWithCess: totalTaxWithCess,
    tdsDeducted: totalTDS,
    netTaxLiability: netTaxAfterTDS,
    gstOnFees: totalGST,
    totalTaxPayable: netTaxAfterTDS + totalGST
  }
}

/**
 * Get tax summary for all financial years
 */
export function getTaxSummaryByFinancialYear(transactions, perSymbol) {
  const years = new Set()
  
  transactions.forEach(t => {
    const date = new Date(t.date)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const fy = month >= 4 ? `${year}-${String(year + 1).slice(-2)}` : `${year - 1}-${String(year).slice(-2)}`
    years.add(fy)
  })

  const summaries = []
  years.forEach(fy => {
    summaries.push(calculateTaxLiability(transactions, perSymbol, fy))
  })

  return summaries.sort((a, b) => b.financialYear.localeCompare(a.financialYear))
}

