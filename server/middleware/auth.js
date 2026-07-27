import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'vaultiq_token'

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set (min 16 characters)')
  }
  return secret
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
    const token = bearer || req.cookies?.[COOKIE_NAME]
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    const payload = jwt.verify(token, getJwtSecret())
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

export { COOKIE_NAME }
