import { useEffect, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { googleOAuthRedirectUrl } from '../utils/api.js'
import { toast } from '../components/Toast.jsx'

export default function LoginPage() {
  const { isAuthenticated, loading, authConfig, loginWithGoogleCredential } = useAuth()
  const [searchParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [gisReady, setGisReady] = useState(Boolean(window.google?.accounts?.id))
  const btnRef = useRef(null)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) toast('Google sign-in failed. Check OAuth credentials.', 'error')
  }, [searchParams])

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGisReady(true)
      return
    }
    if (document.getElementById('gis-script')) {
      const existing = document.getElementById('gis-script')
      existing.addEventListener('load', () => setGisReady(true))
      return
    }
    const script = document.createElement('script')
    script.id = 'gis-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => setGisReady(true)
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!gisReady || !authConfig.googleClientId || !btnRef.current || !window.google?.accounts?.id) return

    window.google.accounts.id.initialize({
      client_id: authConfig.googleClientId,
      callback: async (response) => {
        try {
          setBusy(true)
          await loginWithGoogleCredential(response.credential)
          toast('Signed in', 'success')
        } catch (e) {
          toast(e.message || 'Sign-in failed', 'error')
        } finally {
          setBusy(false)
        }
      },
    })
    btnRef.current.innerHTML = ''
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
      shape: 'rectangular',
    })
  }, [gisReady, authConfig.googleClientId, loginWithGoogleCredential])

  if (!loading && isAuthenticated) return <Navigate to="/app" replace />

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grain" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-signal/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-ink/5 blur-3xl" />

      <header className="shell flex items-center justify-between py-6">
        <div className="font-display text-2xl font-bold tracking-tight">VaultIQ</div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-soft">India · VDA ledger</div>
      </header>

      <main className="shell grid min-h-[calc(100vh-5rem)] items-center gap-10 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="animate-rise max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-signal">Portfolio · Tax · Sync</p>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Your crypto books,
            <br />
            without the fog.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-soft">
            Track CoinDCX trades and manual entries in one FIFO ledger. Tax reports follow current Indian VDA rules — 30% on gains, no loss set-off, TDS &amp; cess included.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-ink/80">
            <li className="flex gap-2"><span className="text-signal">▸</span> Multi-user accounts with Google sign-in</li>
            <li className="flex gap-2"><span className="text-signal">▸</span> Auto-import from CoinDCX API + manual logging</li>
            <li className="flex gap-2"><span className="text-signal">▸</span> Postgres-backed — not stuck in one browser</li>
          </ul>
        </section>

        <section className="animate-rise panel shadow-lift lg:w-full lg:max-w-md lg:justify-self-end">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-soft">Sign in</div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Continue with Google</h2>
          <p className="mt-2 text-sm text-slate-soft">
            Each account keeps its own transactions, prices, and exchange keys.
          </p>

          <div className="mt-6 space-y-3">
            <div ref={btnRef} className="flex min-h-[44px] justify-center overflow-hidden" />
            <a
              href={googleOAuthRedirectUrl()}
              className="btn-secondary w-full"
              onClick={() => setBusy(true)}
            >
              {busy ? 'Opening Google…' : 'Use redirect sign-in'}
            </a>
          </div>

          {!authConfig.googleConfigured && (
            <p className="mt-4 border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
              Server OAuth is not configured yet. Add <span className="font-mono">GOOGLE_CLIENT_ID</span> and{' '}
              <span className="font-mono">GOOGLE_CLIENT_SECRET</span> to <span className="font-mono">server/.env</span>.
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
