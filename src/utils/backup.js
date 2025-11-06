// Simple backup/restore utilities

export function buildSnapshot({ transactions, prices, settings = {}, meta = {} }) {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    meta,
    data: {
      transactions,
      prices,
      settings,
    },
  }
}

export function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const HISTORY_KEY = 'backup.history'

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // ignore
  }
}

export function addSnapshotToHistory(snapshot, { max = 20 } = {}) {
  const history = loadHistory()
  const next = [snapshot, ...history].slice(0, max)
  saveHistory(next)
  return next
}


