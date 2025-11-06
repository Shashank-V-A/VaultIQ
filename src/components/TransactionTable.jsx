import { useMemo, useState } from 'react'
import { download, toCsv } from '../utils/format.js'
import { filterTransactions } from '../utils/calcProfit.js'
import { toast } from './Toast.jsx'
import CoinBadge from './CoinBadge.jsx'

export default function TransactionTable({ transactions, setTransactions, currency }) {
  const [symbol, setSymbol] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const filtered = useMemo(() => filterTransactions(transactions, { symbol, from, to }), [transactions, symbol, from, to])
  const sortedDesc = useMemo(() => [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)), [filtered])

  function remove(id) {
    setTransactions((txs) => txs.filter((t) => t.id !== id))
    toast('Transaction deleted')
  }

  function exportCsv() {
    const csv = toCsv(sortedDesc)
    download('transactions.csv', csv)
    toast('Exported CSV')
  }

  function toggleSelectAll(list) {
    const ids = list.map((t) => t.id)
    const allSelected = ids.every((id) => selectedIds.has(id))
    const next = new Set(selectedIds)
    if (allSelected) {
      ids.forEach((id) => next.delete(id))
    } else {
      ids.forEach((id) => next.add(id))
    }
    setSelectedIds(next)
  }

  function toggleSelect(id) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function removeSelected(type) {
    const list = sortedDesc.filter((t) => t.type === type)
    const toDelete = new Set(list.filter((t) => selectedIds.has(t.id)).map((t) => t.id))
    if (toDelete.size === 0) return
    setTransactions((txs) => txs.filter((t) => !toDelete.has(t.id)))
    setSelectedIds((prev) => {
      const n = new Set(prev)
      list.forEach((t) => n.delete(t.id))
      return n
    })
    toast(`Deleted ${toDelete.size} transactions`)
  }

  function startEdit(tx) {
    setEditingId(tx.id)
    setEditForm({ ...tx })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  function saveEdit() {
    if (!editForm) return
    setTransactions((txs) => txs.map((t) => (t.id === editingId ? { ...t, ...normalizeEdit(editForm) } : t)))
    setEditingId(null)
    setEditForm(null)
    toast('Transaction updated')
  }

  function normalizeEdit(f) {
    return {
      ...f,
      symbol: f.symbol?.toUpperCase() || f.symbol,
      quantity: Number(f.quantity),
      price: Number(f.price),
      feeExchange: Number(f.feeExchange || 0),
      feeGst: Number(f.feeGst || 0),
      tds: Number(f.tds || 0),
      notes: f.notes || ''
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Symbol</label>
          <input className="input" placeholder="BTC" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="ml-auto flex gap-2">
          <button className="btn btn-secondary" onClick={() => { setSymbol(''); setFrom(''); setTo('') }}>Reset</button>
          <button className="btn btn-primary" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      {/* Separate BUY and SELL Transactions */}
      <div className="space-y-6">
        {/* BUY Transactions Section */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-green-600 dark:text-green-400">BUY Transactions</h3>
          <div className="overflow-x-auto">
            <table className="table min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                  <th className="px-2 py-2">
                    <input type="checkbox" onChange={() => toggleSelectAll(sortedDesc.filter(t=>t.type==='BUY'))} checked={sortedDesc.filter(t=>t.type==='BUY').every(t=>selectedIds.has(t.id)) && sortedDesc.filter(t=>t.type==='BUY').length>0} />
                  </th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Symbol</th>
                  <th className="num px-2 py-2">Quantity</th>
                  <th className="num px-2 py-2">Price (incl. fees) ({currency})</th>
                  <th className="num px-2 py-2">Platform</th>
                  <th className="num px-2 py-2">GST</th>
                  <th className="px-2 py-2">Notes</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedDesc.filter(t => t.type === 'BUY').map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-2 py-2"><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} /></td>
                    {editingId === t.id ? (
                      <>
                        <td className="px-2 py-2"><input type="date" className="input" value={editForm.date} onChange={(e)=>setEditForm({...editForm, date:e.target.value})} /></td>
                        <td className="px-2 py-2"><input className="input" value={editForm.symbol} onChange={(e)=>setEditForm({...editForm, symbol:e.target.value})} /></td>
                        <td className="num px-2 py-2"><input type="number" className="input" value={editForm.quantity} onChange={(e)=>setEditForm({...editForm, quantity:e.target.value})} /></td>
                        <td className="num px-2 py-2"><input type="number" className="input" value={editForm.price} onChange={(e)=>setEditForm({...editForm, price:e.target.value})} /></td>
                        <td className="num px-2 py-2"><input type="number" className="input" value={editForm.feeExchange} onChange={(e)=>setEditForm({...editForm, feeExchange:e.target.value})} /></td>
                        <td className="num px-2 py-2"><input type="number" className="input" value={editForm.feeGst} onChange={(e)=>setEditForm({...editForm, feeGst:e.target.value})} /></td>
                        <td className="px-2 py-2"><input className="input" value={editForm.notes||''} onChange={(e)=>setEditForm({...editForm, notes:e.target.value})} /></td>
                        <td className="px-2 py-2 text-right flex gap-2 justify-end">
                          <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                          <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-2">{t.date}</td>
                        <td className="px-2 py-2"><CoinBadge symbol={t.symbol} /></td>
                        <td className="num px-2 py-2">{t.quantity}</td>
                        <td className="num px-2 py-2">{t.price}</td>
                        <td className="num px-2 py-2">{t.feeExchange || 0}</td>
                        <td className="num px-2 py-2">{t.feeGst || 0}</td>
                        <td className="px-2 py-2">{t.notes || '-'}</td>
                        <td className="px-2 py-2 text-right flex gap-2 justify-end">
                          <button className="btn btn-secondary" onClick={() => startEdit(t)}>Edit</button>
                          <button className="btn btn-secondary" onClick={() => remove(t.id)}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {sortedDesc.filter(t => t.type === 'BUY').length === 0 && (
                  <tr>
                    <td className="px-2 py-6 text-center text-gray-500" colSpan={9}>No BUY transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-2 flex justify-end">
              <button className="btn btn-secondary" onClick={() => removeSelected('BUY')}>Delete Selected</button>
            </div>
          </div>
        </div>

        {/* SELL Transactions Section */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-red-600 dark:text-red-400">SELL Transactions</h3>
          <div className="overflow-x-auto">
            <table className="table min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                  <th className="px-2 py-2">
                    <input type="checkbox" onChange={() => toggleSelectAll(sortedDesc.filter(t=>t.type==='SELL'))} checked={sortedDesc.filter(t=>t.type==='SELL').every(t=>selectedIds.has(t.id)) && sortedDesc.filter(t=>t.type==='SELL').length>0} />
                  </th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Symbol</th>
                  <th className="num px-2 py-2">Quantity</th>
                  <th className="num px-2 py-2">Price (incl. fees) ({currency})</th>
                  <th className="num px-2 py-2">Platform</th>
                  <th className="num px-2 py-2">GST</th>
                  <th className="num px-2 py-2">TDS</th>
                  <th className="px-2 py-2">Notes</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedDesc.filter(t => t.type === 'SELL').map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-2 py-2"><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} /></td>
                    {editingId === t.id ? (
                      <>
                        <td className="px-2 py-2"><input type="date" className="input" value={editForm.date} onChange={(e)=>setEditForm({...editForm, date:e.target.value})} /></td>
                        <td className="px-2 py-2"><input className="input" value={editForm.symbol} onChange={(e)=>setEditForm({...editForm, symbol:e.target.value})} /></td>
                        <td className="num px-2 py-2"><input type="number" className="input" value={editForm.quantity} onChange={(e)=>setEditForm({...editForm, quantity:e.target.value})} /></td>
                        <td className="num px-2 py-2"><input type="number" className="input" value={editForm.price} onChange={(e)=>setEditForm({...editForm, price:e.target.value})} /></td>
                        <td className="num px-2 py-2"><input type="number" className="input" value={editForm.feeExchange} onChange={(e)=>setEditForm({...editForm, feeExchange:e.target.value})} /></td>
                        <td className="num px-2 py-2"><input type="number" className="input" value={editForm.feeGst} onChange={(e)=>setEditForm({...editForm, feeGst:e.target.value})} /></td>
                        <td className="num px-2 py-2"><input type="number" className="input" value={editForm.tds} onChange={(e)=>setEditForm({...editForm, tds:e.target.value})} /></td>
                        <td className="px-2 py-2"><input className="input" value={editForm.notes||''} onChange={(e)=>setEditForm({...editForm, notes:e.target.value})} /></td>
                        <td className="px-2 py-2 text-right flex gap-2 justify-end">
                          <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                          <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-2">{t.date}</td>
                        <td className="px-2 py-2"><CoinBadge symbol={t.symbol} /></td>
                        <td className="num px-2 py-2">{t.quantity}</td>
                        <td className="num px-2 py-2">{t.price}</td>
                        <td className="num px-2 py-2">{t.feeExchange || 0}</td>
                        <td className="num px-2 py-2">{t.feeGst || 0}</td>
                        <td className="num px-2 py-2">{t.tds || 0}</td>
                        <td className="px-2 py-2">{t.notes || '-'}</td>
                        <td className="px-2 py-2 text-right flex gap-2 justify-end">
                          <button className="btn btn-secondary" onClick={() => startEdit(t)}>Edit</button>
                          <button className="btn btn-secondary" onClick={() => remove(t.id)}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {sortedDesc.filter(t => t.type === 'SELL').length === 0 && (
                  <tr>
                    <td className="px-2 py-6 text-center text-gray-500" colSpan={10}>No SELL transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-2 flex justify-end">
              <button className="btn btn-secondary" onClick={() => removeSelected('SELL')}>Delete Selected</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

