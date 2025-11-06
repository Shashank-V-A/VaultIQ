export default function Sidebar({ activeTab, setActiveTab }) {
  const items = [
    { key: 'dashboard', label: 'Portfolio' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'tax', label: 'Tax Reports' },
    { key: 'settings', label: 'Settings' },
  ]
  return (
    <aside className="hidden shrink-0 border-r border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60 md:block" style={{ width: 220 }}>
      <div className="p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Menu</div>
        <nav className="flex flex-col gap-1">
          {items.map((i) => (
            <button
              key={i.key}
              onClick={() => setActiveTab(i.key)}
              className={`text-left rounded-md px-3 py-2 text-sm ${activeTab === i.key ? 'bg-brand/15 text-brand' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            >
              {i.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}

