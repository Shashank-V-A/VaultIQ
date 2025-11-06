import ThemeToggle from './ThemeToggle.jsx'

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'tax', label: 'Tax Reports' },
    { key: 'settings', label: 'Settings' },
  ]
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/70 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="https://i.ibb.co/5gYQJzsR/Gemini-Generated-Image-fjgti0fjgti0fjgt.png" alt="VaultIQ" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-lg font-semibold tracking-tight">VaultIQ</span>
        </div>
        <nav className="flex items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

