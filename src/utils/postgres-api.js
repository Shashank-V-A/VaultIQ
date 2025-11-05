// PostgreSQL API client (connects to your backend API)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Check if API is configured
export function isApiConfigured() {
  // Check if API_URL is set and not the default localhost
  // Or if we're in production (not localhost)
  return (API_URL && API_URL !== 'http://localhost:3001') || 
         (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
}

// Generate a unique user ID (for demo purposes, using browser fingerprint)
// In production, you'd want proper authentication
function getUserId() {
  let userId = localStorage.getItem('vaultiq_user_id')
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('vaultiq_user_id', userId)
  }
  return userId
}

// Save transactions to PostgreSQL via API
export async function saveTransactions(transactions) {
  try {
    const userId = getUserId()
    const response = await fetch(`${API_URL}/api/transactions/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error saving transactions:', error)
    throw error
  }
}

// Load transactions from PostgreSQL via API
export async function loadTransactions() {
  try {
    const userId = getUserId()
    const response = await fetch(`${API_URL}/api/data/${userId}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null // No data yet
      }
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.transactions || null
  } catch (error) {
    console.error('Error loading transactions:', error)
    return null
  }
}

// Save prices to PostgreSQL via API
export async function savePrices(prices) {
  try {
    const userId = getUserId()
    const response = await fetch(`${API_URL}/api/prices/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prices })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error saving prices:', error)
    throw error
  }
}

// Load prices from PostgreSQL via API
export async function loadPrices() {
  try {
    const userId = getUserId()
    const response = await fetch(`${API_URL}/api/data/${userId}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null // No data yet
      }
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.prices || null
  } catch (error) {
    console.error('Error loading prices:', error)
    return null
  }
}

// Load all user data
export async function loadAllData() {
  try {
    const userId = getUserId()
    const response = await fetch(`${API_URL}/api/data/${userId}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null // No data yet
      }
      throw new Error(`API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error loading all data:', error)
    return null
  }
}

