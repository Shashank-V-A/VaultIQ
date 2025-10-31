import { useMemo, useState } from 'react'
import { download, toCsv } from '../utils/format.js'
import { filterTransactions } from '../utils/calcProfit.js'
import { toast } from './Toast.jsx'
import CoinBadge from './CoinBadge.jsx'

export default function TransactionTable({ transactions, setTransactions, currency }) {
  const [symbol, setSymbol] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

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

      <div className="overflow-x-auto">
        <table className="table min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left dark:border-gray-800">
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Symbol</th>
              <th className="num px-2 py-2">Quantity</th>
              <th className="num px-2 py-2">Price (incl. fees) ({currency})</th>
              <th className="num px-2 py-2">Platform</th>
              <th className="num px-2 py-2">GST</th>
              <th className="num px-2 py-2">TDS</th>
              <th className="px-2 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedDesc.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-2 py-2">{t.date}</td>
                <td className="px-2 py-2">{t.type === 'BUY' ? <span className="chip-buy">BUY</span> : <span className="chip-sell">SELL</span>}</td>
                <td className="px-2 py-2"><CoinBadge symbol={t.symbol} /></td>
                <td className="num px-2 py-2">{t.quantity}</td>
                <td className="num px-2 py-2">{t.price}</td>
                <td className="num px-2 py-2">{t.feeExchange || 0}</td>
                <td className="num px-2 py-2">{t.feeGst || 0}</td>
                <td className="num px-2 py-2">{t.type === 'SELL' ? (t.tds || 0) : '-'}</td>
                <td className="px-2 py-2 text-right">
                  <button className="btn btn-secondary" onClick={() => remove(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {sortedDesc.length === 0 && (
              <tr>
                <td className="px-2 py-6 text-center text-gray-500" colSpan={8}>No transactions</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

