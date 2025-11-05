import { useEffect, useState, useCallback, useRef } from 'react'
import { isApiConfigured, saveTransactions, savePrices, loadTransactions, loadPrices } from '../utils/postgres-api.js'

// Hybrid storage hook: Cloud-first with localStorage fallback/cache
export function useCloudStorage(key, defaultValue) {
  const [storedValue, setStoredValue] = useState(() => {
    // Initialize from localStorage first (for instant loading)
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        return JSON.parse(item)
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    }
    return defaultValue
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncError, setLastSyncError] = useState(null)
  const hasLoadedFromCloud = useRef(false)

  // Load from cloud on mount (only once)
  useEffect(() => {
    if (!isApiConfigured() || hasLoadedFromCloud.current) {
      setIsLoading(false)
      if (!isApiConfigured()) {
        setLastSyncError('API not configured - using localStorage only')
      }
      return
    }

    async function loadFromCloud() {
      try {
        setIsLoading(true)
        let cloudData = null
        
        if (key === 'data.transactions') {
          cloudData = await loadTransactions()
        } else if (key === 'data.prices') {
          cloudData = await loadPrices()
        }
        
        if (cloudData !== null) {
          setStoredValue(cloudData)
          window.localStorage.setItem(key, JSON.stringify(cloudData))
        }
        hasLoadedFromCloud.current = true
      } catch (error) {
        console.error('Error loading from cloud:', error)
        setLastSyncError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadFromCloud()
  }, [key])

  // Custom setter that syncs to both localStorage and cloud
  const setValue = useCallback(async (value) => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Update state immediately
      setStoredValue(valueToStore)
      
      // Save to localStorage immediately (for offline support and fast reads)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
      
      // Sync to cloud in background (non-blocking)
      if (isApiConfigured()) {
        setIsSyncing(true)
        setLastSyncError(null)
        
        // Don't await - let it sync in background
        Promise.resolve().then(async () => {
          try {
            if (key === 'data.transactions') {
              await saveTransactions(valueToStore)
            } else if (key === 'data.prices') {
              await savePrices(valueToStore)
            }
          } catch (error) {
            console.error('Error syncing to cloud:', error)
            setLastSyncError(error.message)
          } finally {
            setIsSyncing(false)
          }
        })
      }
    } catch (error) {
      console.error(`Error updating storage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue, { isLoading, isSyncing, lastSyncError, isCloudEnabled: isApiConfigured() }]
}

