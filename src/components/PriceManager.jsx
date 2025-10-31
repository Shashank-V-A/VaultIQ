import { useMemo } from 'react'
import { toast } from './Toast.jsx'
import CoinBadge from './CoinBadge.jsx'

export default function PriceManager({ prices, setPrices, perSymbol, currency, onSync, autoPrices, setAutoPrices }) {
  const symbols = useMemo(() => Object.keys(perSymbol).sort(), [perSymbol])

  function handleChange(symbol, value) {
    setPrices((p) => ({ ...p, [symbol]: Number(value) || 0 }))
  }

  return (
    <div className="card">
      <div className="mb-3 text-sm font-medium">Current Prices ({currency})</div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={() => onSync && onSync()}>Sync INR prices now</button>
        <button className="btn btn-secondary" onClick={() => setAutoPrices && setAutoPrices((v) => !v)}>
          Auto refresh 60s: {autoPrices ? 'On' : 'Off'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {symbols.length === 0 && <div className="text-sm text-gray-500">No coins yet. Add transactions to manage prices.</div>}
        {symbols.map((s) => (
          <div key={s} className="flex items-center gap-3">
            <label className="label w-28"><CoinBadge symbol={s} /></label>
            <input
              type="number"
              className="input"
              value={prices[s] ?? ''}
              onChange={(e) => handleChange(s, e.target.value)}
              placeholder={`0.00 ${currency}`}
              step="0.00000001"
            />
          </div>
        ))}
      </div>
      {/* removed footer action buttons per user request */}
    </div>
  )
}

