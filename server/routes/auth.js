import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import { pool, ensureUserSettings } from '../db.js'
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../middleware/auth.js'

const router = Router()

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured')
  return new OAuth2Client(clientId)
}

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are not configured')
  }
  return new OAuth2Client(clientId, clientSecret, redirectUri)
}

async function upsertGoogleUser({ googleId, email, name, avatarUrl }) {
  const existing = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email])
  let user
  if (existing.rows.length) {
    const result = await pool.query(
      `UPDATE users
       SET google_id = $1, email = $2, name = $3, avatar_url = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [googleId, email, name, avatarUrl, existing.rows[0].id]
    )
    user = result.rows[0]
  } else {
    const result = await pool.query(
      `INSERT INTO users (google_id, email, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [googleId, email, name, avatarUrl]
    )
    user = result.rows[0]
  }
  await ensureUserSettings(user.id)
  return user
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
  }
}

router.get('/config', (_req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  })
})

// Redirect-based OAuth (full flow)
router.get('/google', (req, res) => {
  try {
    const client = getOAuthClient()
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
    })
    res.redirect(url)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/google/callback', async (req, res) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173'
  try {
    const code = req.query.code
    if (!code) {
      return res.redirect(`${frontend}/login?error=missing_code`)
    }
    const client = getOAuthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const user = await upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      avatarUrl: payload.picture || null,
    })
    const token = signToken(user)
    setAuthCookie(res, token)
    res.redirect(`${frontend}/app`)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    res.redirect(`${frontend}/login?error=oauth_failed`)
  }
})

// GIS credential / ID token from frontend button
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' })
    }
    const client = getGoogleClient()
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const user = await upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      avatarUrl: payload.picture || null,
    })
    const token = signToken(user)
    setAuthCookie(res, token)
    res.json({ user: publicUser(user), token })
  } catch (error) {
    console.error('Google sign-in error:', error)
    res.status(401).json({ error: 'Google authentication failed' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ user: publicUser(result.rows[0]) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load user' })
  }
})

router.post('/logout', (req, res) => {
  clearAuthCookie(res)
  res.json({ success: true })
})

export default router
