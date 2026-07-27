import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../utils/api.js'
import { computePerSymbolStats, computePortfolioTotals } from '../utils/calcProfit.js'
import { fetchInrPricesPreferCoinDCX } from '../utils/prices.js'
import { useInterval } from '../hooks/useInterval.js'
import { toast } from '../components/Toast.jsx'
import AppShell from '../components/AppShell.jsx'
import Dashboard from '../components/Dashboard.jsx'
import HoldingsTable from '../components/HoldingsTable.jsx'
import PriceManager from '../components/PriceManager.jsx'
import TransactionForm from '../components/TransactionForm.jsx'
import TransactionTable from '../components/TransactionTable.jsx'
import TaxReports from '../components/TaxReports.jsx'
import SettingsPage from '../components/SettingsPage.jsx'

export default function AppPage() {
  const { user, loading, isAuthenticated, logout } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [transactions, setTransactions] = useState([])
  const [prices, setPrices] = useState({})
  const [settings, setSettings] = useState({
    currency: 'INR',
    autoPrices: true,
    tdsPersonType: 'specified',
    surchargeRate: 0,
    coindcxConnected: false,
    hasCoindcxKeys: false,
    coindcxLastSync: null,
  })
  const [booting, setBooting] = useState(true)
  const [syncing, setSyncing] = useState(false)

  async function loadAll() {
    const [txRes, priceRes, settingsRes] = await Promise.all([
      api.getTransactions(),
      api.getPrices(),
      api.getSettings(),
    ])
    setTransactions(txRes.transactions || [])
    setPrices(priceRes.prices || {})
    setSettings((s) => ({ ...s, ...settingsRes.settings }))
  }

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    ;(async () => {
      try {
        setBooting(true)
        await loadAll()
      } catch (e) {
        toast(e.message || 'Failed to load data', 'error')
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const perSymbol = useMemo(() => computePerSymbolStats(transactions, prices), [transactions, prices])
  const totals = useMemo(() => computePortfolioTotals(perSymbol), [perSymbol])

  async function syncPricesNow() {
    const symbols = Object.keys(perSymbol)
    if (!symbols.length) return
    try {
      const updates = await fetchInrPricesPreferCoinDCX(symbols)
      if (!Object.keys(updates).length) return
      const next = { ...prices, ...updates }
      setPrices(next)
      await api.savePrices(next)
    } catch (e) {
      toast(e.message || 'Price sync failed', 'error')
    }
  }

  useInterval(
    () => {
      if (settings.autoPrices) syncPricesNow()
    },
    settings.autoPrices ? 60_000 : null
  )

  async function addTransaction(tx) {
    const { transaction } = await api.createTransaction({
      date: tx.date,
      symbol: tx.symbol,
      type: tx.type,
      quantity: tx.quantity,
      price: tx.price,
      feeExchange: tx.feeExchange || 0,
      feeGst: tx.feeGst || 0,
      tds: tx.tds || 0,
      notes: tx.notes || '',
    })
    setTransactions((list) => [...list, transaction])
    toast('Transaction added', 'success')
  }

  async function updateTransaction(id, patch) {
    const { transaction } = await api.updateTransaction(id, patch)
    setTransactions((list) => list.map((t) => (t.id === id ? transaction : t)))
    toast('Transaction updated', 'success')
  }

  async function deleteTransactions(ids) {
    if (ids.length === 1) {
      await api.deleteTransaction(ids[0])
    } else {
      await api.bulkDeleteTransactions(ids)
    }
    setTransactions((list) => list.filter((t) => !ids.includes(t.id)))
    toast(`Deleted ${ids.length} transaction(s)`, 'success')
  }

  async function saveSettings(patch) {
    const { settings: next } = await api.updateSettings(patch)
    setSettings((s) => ({ ...s, ...next }))
    toast('Settings saved', 'success')
  }

  async function handleCoindcxSync() {
    try {
      setSyncing(true)
      const result = await api.coindcxSync()
      await loadAll()
      toast(`CoinDCX sync: ${result.imported} imported, ${result.skipped} skipped`, 'success')
    } catch (e) {
      toast(e.message || 'CoinDCX sync failed', 'error')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-soft">
        Loading session…
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <AppShell
      user={user}
      tab={tab}
      setTab={setTab}
      onLogout={logout}
      onSyncCoindcx={handleCoindcxSync}
      syncing={syncing}
      coindcxConnected={settings.coindcxConnected || settings.hasCoindcxKeys}
    >
      {booting ? (
        <div className="panel text-sm text-slate-soft">Loading your ledger…</div>
      ) : (
        <>
          {tab === 'dashboard' && (
            <div className="space-y-4 stagger">
              <Dashboard
                perSymbol={perSymbol}
                totals={totals}
                currency={settings.currency}
                transactions={transactions}
                surchargeRate={settings.surchargeRate}
              />
              <HoldingsTable perSymbol={perSymbol} currency={settings.currency} />
              <PriceManager
                prices={prices}
                setPrices={async (updater) => {
                  const next = typeof updater === 'function' ? updater(prices) : updater
                  setPrices(next)
                  await api.savePrices(next)
                }}
                perSymbol={perSymbol}
                currency={settings.currency}
                onSync={syncPricesNow}
                autoPrices={settings.autoPrices}
                setAutoPrices={async (v) => {
                  const next = typeof v === 'function' ? v(settings.autoPrices) : v
                  await saveSettings({ autoPrices: next })
                }}
              />
            </div>
          )}

          {tab === 'transactions' && (
            <div className="space-y-4">
              <TransactionForm onAdd={addTransaction} currency={settings.currency} personType={settings.tdsPersonType} />
              <TransactionTable
                transactions={transactions}
                currency={settings.currency}
                onUpdate={updateTransaction}
                onDelete={deleteTransactions}
                onSyncCoindcx={handleCoindcxSync}
                syncing={syncing}
                coindcxConnected={settings.coindcxConnected || settings.hasCoindcxKeys}
              />
            </div>
          )}

          {tab === 'tax' && (
            <TaxReports
              transactions={transactions}
              perSymbol={perSymbol}
              currency={settings.currency}
              surchargeRate={settings.surchargeRate}
            />
          )}

          {tab === 'settings' && (
            <SettingsPage
              settings={settings}
              onSave={saveSettings}
              onReload={loadAll}
              onSyncCoindcx={handleCoindcxSync}
              syncing={syncing}
            />
          )}
        </>
      )}
    </AppShell>
  )
}
