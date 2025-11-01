import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// You'll need to create a free account at https://supabase.com
// Then create a new project and get your URL and anon key
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create Supabase client
let supabase = null

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// Check if Supabase is configured
export function isSupabaseConfigured() {
  return supabase !== null
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

// Save transactions to cloud
export async function saveTransactions(transactions) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.')
  }

  try {
    const userId = getUserId()
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        transactions: transactions,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving transactions:', error)
    throw error
  }
}

// Load transactions from cloud
export async function loadTransactions() {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const userId = getUserId()
    const { data, error } = await supabase
      .from('user_data')
      .select('transactions')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found, which is OK
    return data?.transactions || null
  } catch (error) {
    console.error('Error loading transactions:', error)
    return null
  }
}

// Save prices to cloud
export async function savePrices(prices) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.')
  }

  try {
    const userId = getUserId()
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        prices: prices,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving prices:', error)
    throw error
  }
}

// Load prices from cloud
export async function loadPrices() {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const userId = getUserId()
    const { data, error } = await supabase
      .from('user_data')
      .select('prices')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data?.prices || null
  } catch (error) {
    console.error('Error loading prices:', error)
    return null
  }
}

// Load all user data
export async function loadAllData() {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const userId = getUserId()
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    console.error('Error loading all data:', error)
    return null
  }
}

