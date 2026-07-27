import clsx from 'clsx'

const TABS = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'transactions', label: 'Ledger' },
  { id: 'tax', label: 'Tax' },
  { id: 'settings', label: 'Settings' },
]

export default function AppShell({
  user,
  tab,
  setTab,
  onLogout,
  children,
  onSyncCoindcx,
  syncing,
  coindcxConnected,
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
        <div className="shell flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-8">
            <div>
              <div className="font-display text-xl font-bold tracking-tight">VaultIQ</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-soft">VDA portfolio</div>
            </div>
            <nav className="hidden items-center gap-5 md:flex">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={clsx('nav-link', tab === t.id && 'nav-link-active')}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {coindcxConnected && (
              <button type="button" className="btn-secondary hidden sm:inline-flex" onClick={onSyncCoindcx} disabled={syncing}>
                {syncing ? 'Syncing…' : 'Sync CoinDCX'}
              </button>
            )}
            <div className="hidden items-center gap-2 border border-ink/10 bg-white/70 px-2.5 py-1.5 sm:flex">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-6 w-6 object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="grid h-6 w-6 place-items-center bg-mist text-[10px] font-bold">{(user?.name || 'U')[0]}</div>
              )}
              <span className="max-w-[140px] truncate text-xs font-medium">{user?.name || user?.email}</span>
            </div>
            <button type="button" className="btn-ghost" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>

        <div className="shell flex gap-4 overflow-x-auto pb-3 md:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={clsx('nav-link whitespace-nowrap', tab === t.id && 'nav-link-active')}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="shell animate-rise py-8">{children}</main>
    </div>
  )
}
