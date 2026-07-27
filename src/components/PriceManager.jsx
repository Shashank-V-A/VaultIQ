import { useState } from 'react'
import { formatCurrency } from '../utils/format.js'
import { toast } from './Toast.jsx'

export default function PriceManager({
  prices,
  setPrices,
  perSymbol,
  currency,
  onSync,
  autoPrices,
  setAutoPrices,
}) {
  const symbols = [...new Set([...Object.keys(perSymbol), ...Object.keys(prices)])].sort()
  const [draft, setDraft] = useState({})

  async function saveSymbol(symbol) {
    const raw = draft[symbol]
    if (raw === undefined || raw === '') return
    const price = Number(raw)
    if (Number.isNaN(price) || price < 0) {
      toast('Invalid price', 'error')
      return
    }
    try {
      await setPrices((p) => ({ ...p, [symbol]: price }))
      setDraft((d) => {
        const n = { ...d }
        delete n[symbol]
        return n
      })
      toast(`${symbol} price saved`, 'success')
    } catch (e) {
      toast(e.message || 'Save failed', 'error')
    }
  }

  return (
    <div className="panel space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-soft">Market</div>
          <h2 className="font-display text-xl font-semibold">INR prices</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={onSync}>Sync now</button>
          <button type="button" className="btn-ghost" onClick={() => setAutoPrices((v) => !v)}>
            Auto 60s: {autoPrices ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {symbols.length === 0 ? (
        <p className="text-sm text-slate-soft">Prices appear once you have trades.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table min-w-[560px] w-full">
            <thead>
              <tr>
                <th>Symbol</th>
                <th className="num text-right">Current</th>
                <th>Override</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {symbols.map((symbol) => (
                <tr key={symbol}>
                  <td className="font-medium">{symbol}</td>
                  <td className="num text-right">{formatCurrency(prices[symbol] || 0, currency)}</td>
                  <td>
                    <input
                      className="input max-w-[160px]"
                      type="number"
                      step="any"
                      placeholder="Set price"
                      value={draft[symbol] ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [symbol]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <button type="button" className="btn-secondary" onClick={() => saveSymbol(symbol)}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
