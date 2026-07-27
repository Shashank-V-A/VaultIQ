import { useState } from 'react'
import { api } from '../utils/api.js'
import { toast } from './Toast.jsx'

export default function SettingsPage({ settings, onSave, onReload, onSyncCoindcx, syncing }) {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [savingKeys, setSavingKeys] = useState(false)

  async function connectCoindcx(e) {
    e.preventDefault()
    if (!apiKey || !apiSecret) {
      toast('Enter both API key and secret', 'error')
      return
    }
    try {
      setSavingKeys(true)
      await api.saveCoindcxKeys(apiKey, apiSecret)
      await api.coindcxTest()
      setApiKey('')
      setApiSecret('')
      await onReload()
      toast('CoinDCX connected', 'success')
    } catch (err) {
      toast(err.message || 'Failed to connect CoinDCX', 'error')
    } finally {
      setSavingKeys(false)
    }
  }

  async function disconnect() {
    try {
      await api.disconnectCoindcx()
      await onReload()
      toast('CoinDCX disconnected', 'success')
    } catch (err) {
      toast(err.message || 'Disconnect failed', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-soft">Preferences</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="panel space-y-4">
        <h2 className="font-display text-lg font-semibold">Tax & display</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="label">Currency</label>
            <select className="input" value={settings.currency} onChange={(e) => onSave({ currency: e.target.value })}>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
          <div>
            <label className="label">TDS person type</label>
            <select
              className="input"
              value={settings.tdsPersonType}
              onChange={(e) => onSave({ tdsPersonType: e.target.value })}
            >
              <option value="specified">Specified (₹50,000 threshold)</option>
              <option value="other">Other (₹10,000 threshold)</option>
            </select>
          </div>
          <div>
            <label className="label">Surcharge on VDA tax</label>
            <select
              className="input"
              value={String(settings.surchargeRate || 0)}
              onChange={(e) => onSave({ surchargeRate: Number(e.target.value) })}
            >
              <option value="0">None (most retail)</option>
              <option value="0.10">10%</option>
              <option value="0.15">15%</option>
              <option value="0.25">25%</option>
              <option value="0.37">37%</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(settings.autoPrices)}
            onChange={(e) => onSave({ autoPrices: e.target.checked })}
          />
          Auto-refresh INR prices every 60s
        </label>
      </div>

      <div className="panel space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">CoinDCX sync</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-soft">
              Store read-only API keys (encrypted at rest). VaultIQ imports INR spot trades into your ledger alongside manual entries.
            </p>
          </div>
          {(settings.coindcxConnected || settings.hasCoindcxKeys) && (
            <span className="chip border-gain/20 bg-gain/10 text-gain">Connected</span>
          )}
        </div>

        {(settings.coindcxConnected || settings.hasCoindcxKeys) ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={onSyncCoindcx} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync trades now'}
            </button>
            <button type="button" className="btn-danger" onClick={disconnect}>Disconnect</button>
            {settings.coindcxLastSync && (
              <span className="text-xs text-slate-soft">
                Last sync: {new Date(settings.coindcxLastSync).toLocaleString()}
              </span>
            )}
          </div>
        ) : (
          <form onSubmit={connectCoindcx} className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">API key</label>
              <input className="input font-mono" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" />
            </div>
            <div className="md:col-span-2">
              <label className="label">API secret</label>
              <input className="input font-mono" type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <button type="submit" className="btn-primary" disabled={savingKeys}>
                {savingKeys ? 'Connecting…' : 'Save & verify'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
