import CoinBadge from './CoinBadge.jsx'
import { formatCurrency, formatNumber } from '../utils/format.js'

export default function HoldingsTable({ perSymbol, currency }) {
  const entries = Object.entries(perSymbol)
    .map(([symbol, v]) => ({ symbol, ...v }))
    .sort((a, b) => b.currentValue - a.currentValue)

  return (
    <div className="card">
      <div className="mb-3 text-sm font-medium">Holdings</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
              <th className="px-2 py-2">Asset</th>
              <th className="px-2 py-2">Qty</th>
              <th className="px-2 py-2">Avg Cost</th>
              <th className="px-2 py-2">Price</th>
              <th className="px-2 py-2">Value</th>
              <th className="px-2 py-2">Unrealized P/L</th>
              <th className="px-2 py-2">P/L %</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const pl = e.unrealized
              const pct = e.holdingCost > 0 ? (pl / e.holdingCost) * 100 : 0
              return (
                <tr key={e.symbol} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="px-2 py-2"><CoinBadge symbol={e.symbol} /></td>
                  <td className="px-2 py-2">{formatNumber(e.holdingQty)}</td>
                  <td className="px-2 py-2">{formatCurrency(e.avgBuyPrice, currency)}</td>
                  <td className="px-2 py-2">{formatCurrency(e.currentPrice, currency)}</td>
                  <td className="px-2 py-2">{formatCurrency(e.currentValue, currency)}</td>
                  <td className={`px-2 py-2 ${pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(pl, currency)}</td>
                  <td className={`px-2 py-2 ${pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{pct.toFixed(2)}%</td>
                </tr>
              )
            })}
            {entries.length === 0 && (
              <tr>
                <td className="px-2 py-6 text-center text-neutral-500" colSpan={7}>No holdings. Add a BUY transaction.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

