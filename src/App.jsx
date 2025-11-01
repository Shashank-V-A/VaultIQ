import { useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import ToastContainer from './components/Toast.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import TransactionTable from './components/TransactionTable.jsx'
import Dashboard from './components/Dashboard.jsx'
import PriceManager from './components/PriceManager.jsx'
import HoldingsTable from './components/HoldingsTable.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { computePerSymbolStats, computePortfolioTotals } from './utils/calcProfit.js'
import { fetchInrPricesPreferCoinDCX } from './utils/prices.js'
import { useInterval } from './hooks/useInterval.js'

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage('ui.activeTab', 'dashboard')
  const [currency, setCurrency] = useLocalStorage('settings.currency', 'INR')
  const [transactions, setTransactions] = useLocalStorage('data.transactions', [])
  const [prices, setPrices] = useLocalStorage('data.prices', {})
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
                  <button className="btn btn-secondary" onClick={() => {
                    console.log('Transactions:', transactions)
                    console.log('Prices:', prices)
                    alert(`Data check:\nTransactions: ${transactions.length}\nPrices: ${Object.keys(prices).length}\n\nCheck browser console (F12) for details.`)
                  }}>Check Data in Console</button>
                  <button className="btn btn-secondary" onClick={() => {
                    if (confirm('This will delete ALL your data. Are you sure?')) {
                      localStorage.clear()
                      location.reload()
                    }
                  }}>Reset All Data</button>
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

