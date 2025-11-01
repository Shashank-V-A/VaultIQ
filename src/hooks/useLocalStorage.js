import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage(key, defaultValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        // Only set default if nothing exists in localStorage
        return defaultValue
      }
      const parsed = JSON.parse(item)
      // If parsed value exists and is valid, use it; otherwise use default
      return parsed !== null && parsed !== undefined ? parsed : defaultValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      // If there's existing data that can't be parsed, keep it in localStorage but use default
      return defaultValue
    }
  })

  // Track if this is the first render to avoid overwriting existing data
  const [isInitialized, setIsInitialized] = useState(false)

  // Save to localStorage whenever storedValue changes (but not on first render)
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
      return // Skip saving on first render to avoid overwriting
    }
    
    try {
      // Only save if value is different from default or if it's truthy
      if (storedValue !== undefined && storedValue !== null) {
        window.localStorage.setItem(key, JSON.stringify(storedValue))
      } else if (storedValue === null) {
        // Remove the key if value is explicitly null
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error)
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please clear some browser data.')
      }
    }
  }, [key, storedValue, isInitialized])

  // Custom setter that ensures localStorage is updated immediately
  const setValue = useCallback((value) => {
    try {
      setStoredValue((prevValue) => {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(prevValue) : value
        
        // Immediately save to localStorage for critical data
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
          console.error(`Error saving to localStorage key "${key}":`, error)
          if (error.name === 'QuotaExceededError') {
            alert('Storage quota exceeded. Please clear some browser data.')
          }
        }
        
        return valueToStore
      })
    } catch (error) {
      console.error(`Error updating localStorage key "${key}":`, error)
    }
  }, [key])

  return [storedValue, setValue]
}

