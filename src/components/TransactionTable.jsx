import { useMemo, useState } from 'react'
import { download, formatCurrency, formatNumber, toCsv } from '../utils/format.js'
import { filterTransactions } from '../utils/calcProfit.js'
import { toast } from './Toast.jsx'
import CoinBadge from './CoinBadge.jsx'

export default function TransactionTable({
  transactions,
  currency,
  onUpdate,
  onDelete,
  onSyncCoindcx,
  syncing,
  coindcxConnected,
}) {
  const [symbol, setSymbol] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const filtered = useMemo(() => filterTransactions(transactions, { symbol, from, to }), [transactions, symbol, from, to])
  const sortedDesc = useMemo(() => [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)), [filtered])
  const buys = sortedDesc.filter((t) => t.type === 'BUY')
  const sells = sortedDesc.filter((t) => t.type === 'SELL')

  function exportCsv() {
    download('vaultiq-transactions.csv', toCsv(sortedDesc))
    toast('CSV exported', 'success')
  }

  function toggleSelect(id) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  async function removeSelected(list) {
    const ids = list.filter((t) => selectedIds.has(t.id)).map((t) => t.id)
    if (!ids.length) return
    try {
      await onDelete(ids)
      setSelectedIds((prev) => {
        const n = new Set(prev)
        ids.forEach((id) => n.delete(id))
        return n
      })
    } catch (e) {
      toast(e.message || 'Delete failed', 'error')
    }
  }

  async function saveEdit() {
    if (!editForm || editForm.source === 'coindcx') {
      toast('CoinDCX imports are read-only', 'error')
      return
    }
    try {
      await onUpdate(editingId, {
        date: editForm.date,
        symbol: String(editForm.symbol).toUpperCase(),
        type: editForm.type,
        quantity: Number(editForm.quantity),
        price: Number(editForm.price),
        feeExchange: Number(editForm.feeExchange || 0),
        feeGst: Number(editForm.feeGst || 0),
        tds: Number(editForm.tds || 0),
        notes: editForm.notes || '',
      })
      setEditingId(null)
      setEditForm(null)
    } catch (e) {
      toast(e.message || 'Update failed', 'error')
    }
  }

  return (
    <div className="panel space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-soft">Ledger</div>
          <h2 className="font-display text-xl font-semibold">All transactions</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {coindcxConnected && (
            <button type="button" className="btn-secondary" onClick={onSyncCoindcx} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync CoinDCX'}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Symbol</label>
          <input className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BTC" />
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button type="button" className="btn-ghost" onClick={() => { setSymbol(''); setFrom(''); setTo('') }}>Clear filters</button>
        </div>
      </div>

      <Section
        title="Buys"
        rows={buys}
        currency={currency}
        selectedIds={selectedIds}
        editingId={editingId}
        editForm={editForm}
        onToggle={toggleSelect}
        onEdit={(tx) => { setEditingId(tx.id); setEditForm({ ...tx }) }}
        onCancel={() => { setEditingId(null); setEditForm(null) }}
        onSave={saveEdit}
        onChangeEdit={setEditForm}
        onDeleteOne={async (id) => { try { await onDelete([id]) } catch (e) { toast(e.message, 'error') } }}
        onDeleteSelected={() => removeSelected(buys)}
      />

      <Section
        title="Sells"
        rows={sells}
        currency={currency}
        selectedIds={selectedIds}
        editingId={editingId}
        editForm={editForm}
        onToggle={toggleSelect}
        onEdit={(tx) => { setEditingId(tx.id); setEditForm({ ...tx }) }}
        onCancel={() => { setEditingId(null); setEditForm(null) }}
        onSave={saveEdit}
        onChangeEdit={setEditForm}
        onDeleteOne={async (id) => { try { await onDelete([id]) } catch (e) { toast(e.message, 'error') } }}
        onDeleteSelected={() => removeSelected(sells)}
      />
    </div>
  )
}

function Section({
  title, rows, currency, selectedIds, editingId, editForm,
  onToggle, onEdit, onCancel, onSave, onChangeEdit, onDeleteOne, onDeleteSelected,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title} <span className="text-slate-soft">({rows.length})</span></h3>
        <button type="button" className="btn-danger" onClick={onDeleteSelected}>Delete selected</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table min-w-[980px] w-full">
          <thead>
            <tr>
              <th className="w-8" />
              <th>Date</th>
              <th>Asset</th>
              <th>Source</th>
              <th className="num text-right">Qty</th>
              <th className="num text-right">Total</th>
              <th className="num text-right">Fee</th>
              <th className="num text-right">TDS</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} className="py-6 text-center text-slate-soft">No rows</td></tr>
            )}
            {rows.map((tx) => {
              const editing = editingId === tx.id
              return (
                <tr key={tx.id}>
                  <td>
                    <input type="checkbox" checked={selectedIds.has(tx.id)} onChange={() => onToggle(tx.id)} />
                  </td>
                  {editing ? (
                    <>
                      <td><input type="date" className="input" value={editForm.date} onChange={(e) => onChangeEdit({ ...editForm, date: e.target.value })} /></td>
                      <td><input className="input" value={editForm.symbol} onChange={(e) => onChangeEdit({ ...editForm, symbol: e.target.value })} /></td>
                      <td><span className="chip-muted">{tx.source}</span></td>
                      <td><input type="number" className="input" value={editForm.quantity} onChange={(e) => onChangeEdit({ ...editForm, quantity: e.target.value })} /></td>
                      <td><input type="number" className="input" value={editForm.price} onChange={(e) => onChangeEdit({ ...editForm, price: e.target.value })} /></td>
                      <td><input type="number" className="input" value={editForm.feeExchange || 0} onChange={(e) => onChangeEdit({ ...editForm, feeExchange: e.target.value })} /></td>
                      <td><input type="number" className="input" value={editForm.tds || 0} onChange={(e) => onChangeEdit({ ...editForm, tds: e.target.value })} /></td>
                      <td><input className="input" value={editForm.notes || ''} onChange={(e) => onChangeEdit({ ...editForm, notes: e.target.value })} /></td>
                      <td className="space-x-1 whitespace-nowrap">
                        <button type="button" className="btn-primary" onClick={onSave}>Save</button>
                        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="num">{tx.date}</td>
                      <td><CoinBadge symbol={tx.symbol} /></td>
                      <td>{tx.source === 'coindcx' ? <span className="chip-muted">CoinDCX</span> : <span className="chip-muted">Manual</span>}</td>
                      <td className="num text-right">{formatNumber(tx.quantity)}</td>
                      <td className="num text-right">{formatCurrency(tx.price, currency)}</td>
                      <td className="num text-right">{formatCurrency(tx.feeExchange || 0, currency)}</td>
                      <td className="num text-right">{formatCurrency(tx.tds || 0, currency)}</td>
                      <td className="max-w-[180px] truncate text-slate-soft">{tx.notes || '—'}</td>
                      <td className="whitespace-nowrap">
                        {tx.source !== 'coindcx' && (
                          <button type="button" className="btn-ghost" onClick={() => onEdit(tx)}>Edit</button>
                        )}
                        <button type="button" className="btn-ghost text-loss" onClick={() => onDeleteOne(tx.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
