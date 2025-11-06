import { useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import ToastContainer from './components/Toast.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import TransactionTable from './components/TransactionTable.jsx'
import Dashboard from './components/Dashboard.jsx'
import PriceManager from './components/PriceManager.jsx'
import HoldingsTable from './components/HoldingsTable.jsx'
import TaxReports from './components/TaxReports.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useCloudStorage } from './hooks/useCloudStorage.js'
import { computePerSymbolStats, computePortfolioTotals } from './utils/calcProfit.js'
import { fetchInrPricesPreferCoinDCX } from './utils/prices.js'
import { useInterval } from './hooks/useInterval.js'
import { buildSnapshot, downloadJson, readFileAsText, loadHistory, addSnapshotToHistory } from './utils/backup.js'

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage('ui.activeTab', 'dashboard')
  const [currency, setCurrency] = useLocalStorage('settings.currency', 'INR')
  
  // Use cloud storage for transactions and prices (persists across devices/browsers)
  const [transactions, setTransactions, transactionsMeta] = useCloudStorage('data.transactions', [])
  const [prices, setPrices, pricesMeta] = useCloudStorage('data.prices', {})
  
  const [autoPrices, setAutoPrices] = useLocalStorage('settings.autoPrices', true)

  const perSymbol = useMemo(() => computePerSymbolStats(transactions, prices), [transactions, prices])
  const totals = useMemo(() => computePortfolioTotals(perSymbol), [perSymbol])

  async function syncPricesNow() {
    const symbols = Object.keys(perSymbol)
    if (symbols.length === 0) return
    const updates = await fetchInrPricesPreferCoinDCX(symbols)
    if (Object.keys(updates).length) {
      setPrices((p) => ({ ...p, ...updates }))
    }
  }

  useInterval(() => { if (autoPrices) syncPricesNow() }, autoPrices ? 60 * 1000 : null)

  // Listen for restore snapshot events triggered by HistoryList
  useEffect(() => {
    function onRestore(e) {
      const s = e.detail
      if (!s?.data) return
      if (!confirm('Restore this snapshot? This will overwrite current data.')) return
      const { transactions: tx = [], prices: pr = {}, settings: st = {} } = s.data
      setTransactions(Array.isArray(tx) ? tx : [])
      setPrices(pr && typeof pr === 'object' ? pr : {})
      if (st?.currency) setCurrency(st.currency)
      if (typeof st?.autoPrices === 'boolean') setAutoPrices(st.autoPrices)
    }
    window.addEventListener('restore-snapshot', onRestore)
    return () => window.removeEventListener('restore-snapshot', onRestore)
  }, [setTransactions, setPrices, setCurrency, setAutoPrices])

  // Backup & Restore helpers
  async function exportAllData() {
    const snapshot = buildSnapshot({
      transactions,
      prices,
      settings: { currency, autoPrices },
      meta: { source: 'manual-export' },
    })
    downloadJson(`vaultiq-backup-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`, snapshot)
  }

  async function importBackup(file) {
    if (!file) return
    try {
      const text = await readFileAsText(file)
      const parsed = JSON.parse(text)
      if (!parsed?.data) throw new Error('Invalid backup file')
      const { transactions: tx = [], prices: pr = {}, settings: st = {} } = parsed.data
      setTransactions(Array.isArray(tx) ? tx : [])
      setPrices(pr && typeof pr === 'object' ? pr : {})
      if (st?.currency) setCurrency(st.currency)
      if (typeof st?.autoPrices === 'boolean') setAutoPrices(st.autoPrices)
      addSnapshotToHistory({ ...parsed, meta: { ...parsed.meta, source: 'import' } })
      alert('Backup imported successfully')
    } catch (e) {
      console.error(e)
      alert('Failed to import backup. Ensure you selected a valid JSON file.')
    }
  }

  function createSnapshot() {
    const snapshot = buildSnapshot({
      transactions,
      prices,
      settings: { currency, autoPrices },
      meta: { source: 'manual-snapshot' },
    })
    const h = addSnapshotToHistory(snapshot)
    alert(`Snapshot saved. Total snapshots: ${h.length}`)
  }

  return (
    <div className="min-h-screen">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <Dashboard perSymbol={perSymbol} totals={totals} currency={currency} />
              <HoldingsTable perSymbol={perSymbol} currency={currency} />
              <PriceManager
                prices={prices}
                setPrices={setPrices}
                perSymbol={perSymbol}
                currency={currency}
                onSync={syncPricesNow}
                autoPrices={autoPrices}
                setAutoPrices={setAutoPrices}
              />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <TransactionForm onAdd={(tx) => setTransactions((t) => [...t, tx])} currency={currency} />
              <TransactionTable transactions={transactions} setTransactions={setTransactions} currency={currency} />
            </div>
          )}

          {activeTab === 'tax' && (
            <TaxReports transactions={transactions} perSymbol={perSymbol} currency={currency} />
          )}

          {activeTab === 'settings' && (
            <div className="card space-y-3">
              <div className="text-sm font-medium">Settings</div>
              <div>
                <label className="label">Currency</label>
                <select className="input max-w-xs" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn btn-secondary" onClick={syncPricesNow}>Sync INR prices now</button>
                  <button className="btn btn-secondary" onClick={() => setAutoPrices((v) => !v)}>Auto refresh 60s: {autoPrices ? 'On' : 'Off'}</button>
                </div>
                <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
                  <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">Data Status: {transactions.length} transactions, {Object.keys(prices).length} price entries</div>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-secondary" onClick={exportAllData}>Export Backup (JSON)</button>
                      <label className="btn btn-secondary cursor-pointer">
                        Import Backup
                        <input type="file" accept="application/json" className="hidden" onChange={(e) => importBackup(e.target.files?.[0])} />
                      </label>
                      <button className="btn btn-secondary" onClick={createSnapshot}>Create Snapshot</button>
                      <button className="btn btn-secondary" onClick={() => {
                        if (confirm('This will delete ALL your data. Are you sure?')) {
                          localStorage.clear()
                          location.reload()
                        }
                      }}>Reset All Data</button>
                    </div>
                    <HistoryList />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}

function HistoryList() {
  const [items, setItems] = useState(loadHistory())

  function restore(idx) {
    try {
      const s = items[idx]
      if (!s?.data) return alert('Invalid snapshot')
      const ev = new CustomEvent('restore-snapshot', { detail: s })
      window.dispatchEvent(ev)
    } catch (e) {
      console.error(e)
    }
  }

  // Allow parent to refresh list by listening to storage changes
  useInterval(() => setItems(loadHistory()), 2000)

  if (!items.length) return null
  return (
    <div className="mt-3">
      <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Snapshots</div>
      <div className="flex flex-col gap-2">
        {items.slice(0,5).map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-xs dark:border-gray-800">
            <div>
              <div className="font-medium">{new Date(s.createdAt).toLocaleString()}</div>
              <div className="text-gray-500">{s?.meta?.source || 'snapshot'} • tx: {s?.data?.transactions?.length || 0} • prices: {Object.keys(s?.data?.prices || {}).length}</div>
            </div>
            <button className="btn btn-secondary" onClick={() => restore(i)}>Restore</button>
          </div>
        ))}
      </div>
    </div>
  )
}

