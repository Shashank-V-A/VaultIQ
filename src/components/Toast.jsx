import { useEffect, useState } from 'react'

let listeners = []
export function toast(message, type = 'success') {
  for (const l of listeners) l({ id: Math.random().toString(36).slice(2), message, type })
}

export default function ToastContainer() {
  const [items, setItems] = useState([])
  useEffect(() => {
    const handler = (item) => {
      setItems((prev) => [...prev, item])
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== item.id)), 2500)
    }
    listeners.push(handler)
    return () => {
      listeners = listeners.filter((l) => l !== handler)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto card border ${t.type === 'error' ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950' : 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950'}`}
        >
          <div className="text-sm">{t.message}</div>
        </div>
      ))}
    </div>
  )
}

