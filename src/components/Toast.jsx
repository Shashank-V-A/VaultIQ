import { useEffect, useRef } from 'react'

let listeners = new Set()
let seq = 0

export function toast(message, type = 'info') {
  const item = { id: ++seq, message, type }
  listeners.forEach((fn) => fn(item))
}

export default function ToastContainer() {
  const ref = useRef(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    function onToast(item) {
      const el = document.createElement('div')
      el.className = [
        'pointer-events-auto border px-3 py-2 text-sm shadow-lift animate-rise',
        item.type === 'error' ? 'border-loss/30 bg-white text-loss' : '',
        item.type === 'success' ? 'border-gain/30 bg-white text-gain' : '',
        item.type === 'info' ? 'border-ink/10 bg-white text-ink' : '',
      ]
        .filter(Boolean)
        .join(' ')
      el.textContent = item.message
      root.appendChild(el)
      setTimeout(() => {
        el.style.opacity = '0'
        el.style.transition = 'opacity 200ms'
        setTimeout(() => el.remove(), 220)
      }, 3200)
    }

    listeners.add(onToast)
    return () => listeners.delete(onToast)
  }, [])

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    />
  )
}
