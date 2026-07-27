import { formatCurrency, formatNumber } from '../utils/format.js'
import CoinBadge from './CoinBadge.jsx'

export default function HoldingsTable({ perSymbol, currency }) {
  const rows = Object.entries(perSymbol)
    .map(([symbol, s]) => ({ symbol, ...s }))
    .filter((r) => r.holdingQty > 1e-12)
    .sort((a, b) => b.currentValue - a.currentValue)

  return (
    <div className="panel">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-soft">Positions</div>
        <h2 className="font-display text-xl font-semibold">Holdings</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="table min-w-[720px] w-full">
          <thead>
            <tr>
              <th>Asset</th>
              <th className="num text-right">Qty</th>
              <th className="num text-right">Avg cost</th>
              <th className="num text-right">Price</th>
              <th className="num text-right">Value</th>
              <th className="num text-right">Unrealized</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-soft">No open holdings</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.symbol}>
                <td><CoinBadge symbol={r.symbol} /></td>
                <td className="num text-right">{formatNumber(r.holdingQty)}</td>
                <td className="num text-right">{formatCurrency(r.avgBuyPrice, currency)}</td>
                <td className="num text-right">{formatCurrency(r.currentPrice, currency)}</td>
                <td className="num text-right">{formatCurrency(r.currentValue, currency)}</td>
                <td className={`num text-right ${r.unrealized >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {formatCurrency(r.unrealized, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
