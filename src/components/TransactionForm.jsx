import { useState } from 'react'
import { toast } from './Toast.jsx'
import { calculateTDS, getTdsThreshold } from '../utils/taxCalculator.js'

const emptyForm = {
  date: '',
  symbol: '',
  type: 'BUY',
  quantity: '',
  price: '',
  feeExchange: '',
  feeGst: '',
  tds: '',
  notes: '',
}

export default function TransactionForm({ onAdd, currency, personType = 'specified' }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const threshold = getTdsThreshold(personType)

  function blockInvalid(e) {
    if (['e', 'E', '+'].includes(e.key)) e.preventDefault()
  }

  function update(field, value) {
    setForm((f) => {
      const updated = { ...f, [field]: value }
      if (updated.type === 'SELL' && (field === 'price' || field === 'type') && updated.price) {
        const tdsAmount = calculateTDS(Number(updated.price), personType)
        if (tdsAmount > 0) updated.tds = tdsAmount.toFixed(2)
      } else if (field === 'type' && value === 'BUY') {
        updated.tds = ''
      }
      return updated
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { date, symbol, type, quantity, price, feeExchange, feeGst, tds, notes } = form
    if (!date || !symbol || !quantity || !price) {
      toast('Fill date, symbol, quantity, and total amount', 'error')
      return
    }
    try {
      setSaving(true)
      await onAdd({
        date,
        symbol: symbol.trim().toUpperCase(),
        type,
        quantity: Number(quantity),
        price: Number(price),
        feeExchange: feeExchange ? Number(feeExchange) : 0,
        feeGst: feeGst ? Number(feeGst) : 0,
        tds: tds ? Number(tds) : 0,
        notes: notes?.trim() || '',
      })
      setForm(emptyForm)
    } catch (err) {
      toast(err.message || 'Failed to add', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-soft">Manual entry</div>
          <h2 className="font-display text-xl font-semibold">Log a trade</h2>
        </div>
        <span className="chip-muted">Alongside CoinDCX sync</span>
      </div>

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
          <input type="number" step="any" className="input" onKeyDown={blockInvalid} value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Total consideration ({currency})</label>
          <input type="number" step="any" className="input" onKeyDown={blockInvalid} value={form.price} onChange={(e) => update('price', e.target.value)} />
        </div>
      </div>

      <div className="border border-ink/10 bg-mist/40 p-4">
        <div className="mb-3 text-sm font-semibold">Fees & TDS (informational)</div>
        <p className="mb-3 text-xs text-slate-soft">
          Under VDA rules, fees are not deductible from taxable gains. Store them here for reporting. Total consideration above is used for FIFO cost/proceeds.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="label">Platform fee</label>
            <input type="number" step="any" className="input" onKeyDown={blockInvalid} value={form.feeExchange} onChange={(e) => update('feeExchange', e.target.value)} />
          </div>
          <div>
            <label className="label">GST on fee</label>
            <input type="number" step="any" className="input" onKeyDown={blockInvalid} value={form.feeGst} onChange={(e) => update('feeGst', e.target.value)} />
          </div>
          {form.type === 'SELL' && (
            <div>
              <label className="label">TDS (1% if &gt; ₹{threshold.toLocaleString('en-IN')})</label>
              <input type="number" step="any" className="input" onKeyDown={blockInvalid} value={form.tds} onChange={(e) => update('tds', e.target.value)} />
            </div>
          )}
        </div>
        <div className="mt-3">
          <label className="label">Notes</label>
          <textarea className="input min-h-[72px]" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Order id, reason, etc." />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add transaction'}</button>
        <button type="button" className="btn-secondary" onClick={() => setForm(emptyForm)}>Reset</button>
      </div>
    </form>
  )
}
