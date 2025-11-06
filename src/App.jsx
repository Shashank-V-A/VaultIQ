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
import { isApiConfigured } from './utils/postgres-api.js'

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
                <div className="border-t border-gray-200 pt-3 dark:border-gray-800 space-y-3">
                  <div className="text-sm font-medium">PostgreSQL Storage</div>
                  {isApiConfigured() ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <span>✓</span>
                        <span>PostgreSQL storage enabled - your data is saved to the database</span>
                      </div>
                      {(transactionsMeta.isSyncing || pricesMeta.isSyncing) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Syncing to database...</div>
                      )}
                      {transactionsMeta.lastSyncError && (
                        <div className="text-xs text-red-600 dark:text-red-400">Sync error: {transactionsMeta.lastSyncError}</div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="text-yellow-600 dark:text-yellow-400">
                        ⚠ PostgreSQL API not configured - data is stored locally only
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        To enable PostgreSQL storage (data persists across browsers/devices):
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>Set up a PostgreSQL database (local or cloud like AWS RDS, Railway, Render, etc.)</li>
                          <li>Deploy the API server (see <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">server/</code> folder)</li>
                          <li>Set <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">VITE_API_URL</code> environment variable in Vercel</li>
                          <li>See <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">POSTGRES_SETUP.md</code> for detailed instructions</li>
                        </ol>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
                    <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">Data Status: {transactions.length} transactions, {Object.keys(prices).length} price entries</div>
                    <button className="btn btn-secondary" onClick={() => {
                      if (confirm('This will delete ALL your data. Are you sure?')) {
                        localStorage.clear()
                        location.reload()
                      }
                    }}>Reset All Data</button>
                  </div>
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

