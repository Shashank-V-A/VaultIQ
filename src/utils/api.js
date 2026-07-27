const API_BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text }
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  getAuthConfig: () => request('/api/auth/config'),
  me: () => request('/api/auth/me'),
  googleCredential: (credential) =>
    request('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  getTransactions: () => request('/api/transactions'),
  createTransaction: (tx) =>
    request('/api/transactions', { method: 'POST', body: JSON.stringify(tx) }),
  updateTransaction: (id, tx) =>
    request(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(tx) }),
  deleteTransaction: (id) =>
    request(`/api/transactions/${id}`, { method: 'DELETE' }),
  bulkDeleteTransactions: (ids) =>
    request('/api/transactions/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),

  getPrices: () => request('/api/prices'),
  savePrices: (prices) =>
    request('/api/prices', { method: 'PUT', body: JSON.stringify({ prices }) }),
  savePrice: (symbol, price) =>
    request(`/api/prices/${symbol}`, { method: 'PUT', body: JSON.stringify({ price }) }),

  getSettings: () => request('/api/settings'),
  updateSettings: (settings) =>
    request('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  saveCoindcxKeys: (apiKey, apiSecret) =>
    request('/api/settings/coindcx', { method: 'POST', body: JSON.stringify({ apiKey, apiSecret }) }),
  disconnectCoindcx: () => request('/api/settings/coindcx', { method: 'DELETE' }),

  coindcxStatus: () => request('/api/coindcx/status'),
  coindcxTest: () => request('/api/coindcx/test', { method: 'POST' }),
  coindcxSync: () => request('/api/coindcx/sync', { method: 'POST' }),
}

export function googleOAuthRedirectUrl() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  return `${base}/api/auth/google`
}
