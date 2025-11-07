import { useMemo } from 'react'
import { formatCurrency } from '../utils/format.js'

/**
 * Calculate fees and TDS statistics from transactions
 */
function calculateFeesAndTDS(transactions) {
  let totalPlatformFeeBuy = 0
  let totalPlatformFeeSell = 0
  let totalGSTBuy = 0
  let totalGSTSell = 0
  let totalTDSClaimable = 0
  let buyCount = 0
  let sellCount = 0

  transactions.forEach(tx => {
    const platformFee = Number(tx.feeExchange) || 0
    const gstOnFee = Number(tx.feeGst) || 0
    const tds = Number(tx.tds) || 0

    if (tx.type === 'BUY') {
      totalPlatformFeeBuy += platformFee
      totalGSTBuy += gstOnFee
      buyCount++
    } else if (tx.type === 'SELL') {
      totalPlatformFeeSell += platformFee
      totalGSTSell += gstOnFee
      totalTDSClaimable += tds
      sellCount++
    }
  })

  // Calculate expected GST if not already stored (18% of platform fee)
  // This helps users verify if GST was calculated correctly
  const expectedGSTBuy = totalPlatformFeeBuy * 0.18
  const expectedGSTSell = totalPlatformFeeSell * 0.18

  return {
    totalPlatformFeeBuy,
    totalPlatformFeeSell,
    totalGSTBuy,
    totalGSTSell,
    expectedGSTBuy,
    expectedGSTSell,
    totalTDSClaimable,
    buyCount,
    sellCount,
    totalPlatformFee: totalPlatformFeeBuy + totalPlatformFeeSell,
    totalGST: totalGSTBuy + totalGSTSell,
  }
}

export default function FeesAndTDSReport({ transactions, currency }) {
  const stats = useMemo(() => calculateFeesAndTDS(transactions), [transactions])

  if (transactions.length === 0) {
    return null
  }

  return (
    <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <div className="mb-4 text-sm font-semibold text-blue-800 dark:text-blue-200">
        Fees & TDS Summary
      </div>
      
      <div className="space-y-4">
        {/* Platform Fees Section */}
        <div>
          <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            Platform Fees Paid
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-white/60 dark:bg-neutral-800/60 p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">BUY Transactions</div>
              <div className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.totalPlatformFeeBuy, currency)}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {stats.buyCount} transaction{stats.buyCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="rounded-lg bg-white/60 dark:bg-neutral-800/60 p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">SELL Transactions</div>
              <div className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.totalPlatformFeeSell, currency)}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {stats.sellCount} transaction{stats.sellCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="rounded-lg bg-blue-100/60 dark:bg-blue-800/40 p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Platform Fees</div>
              <div className="mt-1 text-base font-semibold text-blue-900 dark:text-blue-100">
                {formatCurrency(stats.totalPlatformFee, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* GST on Fees Section */}
        <div>
          <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            GST on Fees (18%)
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-white/60 dark:bg-neutral-800/60 p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">GST on BUY Fees</div>
              <div className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.totalGSTBuy, currency)}
              </div>
              {stats.totalPlatformFeeBuy > 0 && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Expected: {formatCurrency(stats.expectedGSTBuy, currency)}
                  {Math.abs(stats.totalGSTBuy - stats.expectedGSTBuy) > 0.01 && (
                    <span className="ml-1 text-orange-600 dark:text-orange-400">
                      (diff: {formatCurrency(stats.totalGSTBuy - stats.expectedGSTBuy, currency)})
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-white/60 dark:bg-neutral-800/60 p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">GST on SELL Fees</div>
              <div className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.totalGSTSell, currency)}
              </div>
              {stats.totalPlatformFeeSell > 0 && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Expected: {formatCurrency(stats.expectedGSTSell, currency)}
                  {Math.abs(stats.totalGSTSell - stats.expectedGSTSell) > 0.01 && (
                    <span className="ml-1 text-orange-600 dark:text-orange-400">
                      (diff: {formatCurrency(stats.totalGSTSell - stats.expectedGSTSell, currency)})
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-blue-100/60 dark:bg-blue-800/40 p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Total GST on Fees</div>
              <div className="mt-1 text-base font-semibold text-blue-900 dark:text-blue-100">
                {formatCurrency(stats.totalGST, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* TDS Section */}
        <div>
          <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            TDS Claimable
          </div>
          <div className="rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40 p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total TDS Deducted (Claimable on Tax Return)
            </div>
            <div className="mt-1 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
              {formatCurrency(stats.totalTDSClaimable, currency)}
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              * TDS deducted at source (1% on SELL transactions &gt; ₹50,000) can be claimed as credit against your final tax liability when filing ITR.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-white/80 dark:bg-neutral-800/80 p-3">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Total Cost Summary</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platform Fees:</span>
              <span className="font-medium">{formatCurrency(stats.totalPlatformFee, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">GST on Fees:</span>
              <span className="font-medium">{formatCurrency(stats.totalGST, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-1 mt-1">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Total Fees Paid:</span>
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                {formatCurrency(stats.totalPlatformFee + stats.totalGST, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

