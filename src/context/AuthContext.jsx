import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authConfig, setAuthConfig] = useState({ googleClientId: null, googleConfigured: false })

  const refresh = useCallback(async () => {
    try {
      const [{ user: me }, config] = await Promise.all([
        api.me().catch((e) => {
          if (e.status === 401) return { user: null }
          throw e
        }),
        api.getAuthConfig().catch(() => ({ googleClientId: null, googleConfigured: false })),
      ])
      setUser(me)
      setAuthConfig(config)
    } catch (error) {
      console.error(error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const loginWithGoogleCredential = useCallback(async (credential) => {
    const data = await api.googleCredential(credential)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api.logout().catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, authConfig, refresh, loginWithGoogleCredential, logout, isAuthenticated: Boolean(user) }),
    [user, loading, authConfig, refresh, loginWithGoogleCredential, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
