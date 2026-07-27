// Indian VDA tax engine
// Income-tax Act provisions carried forward into the Income-tax Act, 2025:
// - Flat 30% on income from transfer of VDAs (erstwhile §115BBH)
// - Only cost of acquisition deductible; fees/expenses not deductible
// - Losses cannot be set off against other VDA gains or any other income, and cannot be carried forward
// - 1% TDS on specified transfers (erstwhile §194S), thresholds by person type
// - Health & Education Cess 4% on (tax + surcharge)
// Budget 2025/2026 retained the rate structure; compliance/reporting for exchanges was tightened.

function sortByDateAsc(transactions) {
  return [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
}

function getFinancialYear(dateInput) {
  const date = new Date(dateInput)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return month >= 4
    ? `${year}-${String(year + 1).slice(-2)}`
    : `${year - 1}-${String(year).slice(-2)}`
}

export function currentFinancialYear() {
  return getFinancialYear(new Date())
}

export function fyDateRange(financialYear) {
  const [startYearRaw, endYearRaw] = financialYear.split('-')
  const startYear = Number(startYearRaw.length === 4 ? startYearRaw : `20${startYearRaw}`)
  const endYear = Number(endYearRaw.length === 4 ? endYearRaw : `20${endYearRaw}`)
  return {
    fyStart: new Date(`${startYear}-04-01T00:00:00`),
    fyEnd: new Date(`${endYear}-03-31T23:59:59.999`),
  }
}

/** 30% base tax on positive taxable VDA income only */
export function calculateIncomeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0
  return taxableIncome * 0.3
}

/** Surcharge on VDA tax — user-selected rate from settings (0 / 0.10 / 0.15 / 0.25 / 0.37) */
export function calculateSurcharge(incomeTax, surchargeRate = 0) {
  if (incomeTax <= 0 || surchargeRate <= 0) return 0
  return incomeTax * Number(surchargeRate)
}

export function calculateCess(taxPlusSurcharge) {
  if (taxPlusSurcharge <= 0) return 0
  return taxPlusSurcharge * 0.04
}

export function calculateTotalTax(taxableIncome, surchargeRate = 0) {
  if (taxableIncome <= 0) {
    return { tax: 0, surcharge: 0, cess: 0, total: 0, taxableIncome: 0 }
  }
  const tax = calculateIncomeTax(taxableIncome)
  const surcharge = calculateSurcharge(tax, surchargeRate)
  const cess = calculateCess(tax + surcharge)
  return {
    tax,
    surcharge,
    cess,
    total: tax + surcharge + cess,
    taxableIncome,
  }
}

/**
 * TDS under §194S — 1% when annual / transfer consideration exceeds threshold.
 * specified persons (certain individuals/HUFs): ₹50,000
 * others: ₹10,000
 */
export function getTdsThreshold(personType = 'specified') {
  return personType === 'other' ? 10000 : 50000
}

export function calculateTDS(transferValue, personType = 'specified') {
  const threshold = getTdsThreshold(personType)
  if (transferValue <= threshold) return 0
  return transferValue * 0.01
}

/**
 * FIFO walk producing per-SELL profit, respecting §115BBH:
 * positive profits are taxable; losses are tracked but never set off.
 */
export function computeVdaTransferResults(transactions, { fyStart = null, fyEnd = null } = {}) {
  const all = sortByDateAsc(transactions)
  const upTo = fyEnd
    ? all.filter((t) => new Date(t.date) <= fyEnd)
    : all

  const bySymbol = {}
  for (const t of upTo) {
    const key = String(t.symbol).toUpperCase()
    if (!bySymbol[key]) bySymbol[key] = []
    bySymbol[key].push(t)
  }

  const sells = []
  let taxableGains = 0
  let disregardedLosses = 0
  let netAccountingPnL = 0

  for (const symbol of Object.keys(bySymbol)) {
    const lots = []
    for (const t of bySymbol[symbol]) {
      const qty = Number(t.quantity)
      const totalAmount = Number(t.price)
      const tDate = new Date(t.date)

      if (t.type === 'BUY') {
        lots.push({ qtyRemaining: qty, costPerUnit: totalAmount / qty })
        continue
      }

      if (t.type !== 'SELL') continue

      let qtyToSell = qty
      let costBasis = 0
      while (qtyToSell > 0 && lots.length > 0) {
        const lot = lots[0]
        const used = Math.min(lot.qtyRemaining, qtyToSell)
        costBasis += used * lot.costPerUnit
        lot.qtyRemaining -= used
        qtyToSell -= used
        if (lot.qtyRemaining <= 1e-12) lots.shift()
      }

      const proceeds = totalAmount
      const profit = proceeds - costBasis
      netAccountingPnL += profit

      const inFy = (!fyStart || tDate >= fyStart) && (!fyEnd || tDate <= fyEnd)
      if (!inFy) continue

      const taxable = profit > 0 ? profit : 0
      const loss = profit < 0 ? Math.abs(profit) : 0
      taxableGains += taxable
      disregardedLosses += loss

      sells.push({
        id: t.id,
        date: t.date,
        symbol,
        proceeds,
        costBasis,
        profit,
        taxableGain: taxable,
        disregardedLoss: loss,
        tds: Number(t.tds || 0),
        feeGst: Number(t.feeGst || t.fee_gst || 0),
        feeExchange: Number(t.feeExchange || t.fee_exchange || 0),
      })
    }
  }

  return {
    sells,
    taxableGains,
    disregardedLosses,
    netAccountingPnL,
  }
}

export function calculateTaxLiability(transactions, _perSymbol, financialYear = null, options = {}) {
  const fy = financialYear || currentFinancialYear()
  const { fyStart, fyEnd } = fyDateRange(fy)
  const surchargeRate = Number(options.surchargeRate || 0)

  const results = computeVdaTransferResults(transactions, { fyStart, fyEnd })
  const totalTDS = results.sells.reduce((s, x) => s + x.tds, 0)
  const totalGST = results.sells.reduce((s, x) => s + x.feeGst, 0)

  const taxParts = calculateTotalTax(results.taxableGains, surchargeRate)
  const netTaxAfterTDS = Math.max(0, taxParts.total - totalTDS)

  return {
    financialYear: fy,
    // Accounting net (informational — NOT the tax base under §115BBH)
    accountingNetPnL: results.netAccountingPnL,
    // Tax base: sum of positive gains only; losses disregarded
    taxableGains: results.taxableGains,
    disregardedLosses: results.disregardedLosses,
    incomeTax30Percent: taxParts.tax,
    surcharge: taxParts.surcharge,
    surchargeRate,
    cess4Percent: taxParts.cess,
    totalTaxWithCess: taxParts.total,
    tdsDeducted: totalTDS,
    netTaxLiability: netTaxAfterTDS,
    gstOnFees: totalGST,
    totalTaxPayable: netTaxAfterTDS + totalGST,
    sellCount: results.sells.length,
    regimeNote:
      'Under §115BBH / Income-tax Act 2025, VDA losses cannot be set off against other VDA gains or any other income, and cannot be carried forward. Only cost of acquisition is deductible.',
  }
}

export function getTaxSummaryByFinancialYear(transactions, perSymbol, options = {}) {
  const years = new Set()
  transactions.forEach((t) => years.add(getFinancialYear(t.date)))
  const summaries = [...years].map((fy) =>
    calculateTaxLiability(transactions, perSymbol, fy, options)
  )
  return summaries.sort((a, b) => b.financialYear.localeCompare(a.financialYear))
}
