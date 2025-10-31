import { useState } from 'react'
import { toast } from './Toast.jsx'

const emptyForm = {
  date: '',
  symbol: '',
  type: 'BUY',
  quantity: '',
  price: '',
  feeExchange: '',
  feeGst: '',
  tds: '',
}

export default function TransactionForm({ onAdd, currency }) {
  const [form, setForm] = useState(emptyForm)

  function blockInvalid(e) {
    if (["e", "E", "+"].includes(e.key)) e.preventDefault()
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function reset() {
    setForm(emptyForm)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const { date, symbol, type, quantity, price, feeExchange, feeGst, tds } = form
    if (!date || !symbol || !quantity || !price) {
      toast('Please fill date, symbol, quantity, and price', 'error')
      return
    }
    const tx = {
      id: crypto.randomUUID(),
      date,
      symbol: symbol.trim().toUpperCase(),
      type,
      quantity: Number(quantity),
      price: Number(price),
      feeExchange: feeExchange ? Number(feeExchange) : 0,
      feeGst: feeGst ? Number(feeGst) : 0,
      tds: tds ? Number(tds) : 0,
    }
    onAdd(tx)
    toast('Transaction added')
    reset()
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={(e) => update('date', e.target.value)} />
        </div>
        <div>
          <label className="label">Symbol</label>
          <input type="text" placeholder="BTC" className="input" value={form.symbol} onChange={(e) => update('symbol', e.target.value)} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => update('type', e.target.value)}>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
        <div>
          <label className="label">Quantity</label>
          <input type="number" step="0.00000001" inputMode="decimal" className="input" onKeyDown={blockInvalid} value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
        </div>
        <div>
          <label className="label whitespace-nowrap">Total Price (incl. all fees) ({currency})</label>
          <input type="number" step="0.00000001" inputMode="decimal" className="input" onKeyDown={blockInvalid} value={form.price} onChange={(e) => update('price', e.target.value)} />
        </div>
      </div>
      <div className="surface">
        <div className="mb-2 text-sm font-medium">Advanced Fee Breakdown</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="label">Platform fee ({currency})</label>
            <input type="number" step="0.00000001" inputMode="decimal" className="input" onKeyDown={blockInvalid} value={form.feeExchange} onChange={(e) => update('feeExchange', e.target.value)} />
          </div>
          <div>
            <label className="label">GST on fee ({currency})</label>
            <input type="number" step="0.00000001" inputMode="decimal" className="input" onKeyDown={blockInvalid} value={form.feeGst} onChange={(e) => update('feeGst', e.target.value)} />
          </div>
          {form.type === 'SELL' && (
            <div>
              <label className="label">TDS (1%) ({currency})</label>
              <input type="number" step="0.00000001" inputMode="decimal" className="input" onKeyDown={blockInvalid} value={form.tds} onChange={(e) => update('tds', e.target.value)} />
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">Note: Total Price should already include all fees/taxes. It's used directly for cost/proceeds.</p>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">Add Transaction</button>
        <button type="button" className="btn btn-secondary" onClick={reset}>Reset Form</button>
      </div>
    </form>
  )
}

