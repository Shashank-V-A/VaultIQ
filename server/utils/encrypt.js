import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12

function getKey() {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw || raw.length < 32) {
    throw new Error('ENCRYPTION_KEY must be set (min 32 characters)')
  }
  return crypto.createHash('sha256').update(raw).digest()
}

export function encrypt(plaintext) {
  if (!plaintext) return null
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function decrypt(payload) {
  if (!payload) return null
  const [ivHex, tagHex, dataHex] = String(payload).split(':')
  if (!ivHex || !tagHex || !dataHex) throw new Error('Invalid encrypted payload')
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
  return dec.toString('utf8')
}
