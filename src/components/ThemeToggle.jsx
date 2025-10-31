import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved) setDark(saved === 'dark')
    } catch {}
  }, [])

  return (
    <button className="btn btn-secondary" onClick={() => setDark((d) => !d)} title="Toggle theme">
      {dark ? '🌙' : '☀️'}
    </button>
  )
}

