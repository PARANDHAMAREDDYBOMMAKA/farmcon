import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required')
  }
  const salt = process.env.ENCRYPTION_SALT || 'farmcon-default-salt'
  return scryptSync(secret, salt, 32)
}

export const encrypt = (text: string): string => {
  if (!text) return text

  try {
    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch {
    return text
  }
}

export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText

  if (!encryptedText.includes(':')) {
    return encryptedText
  }

  try {
    const key = getEncryptionKey()
    const parts = encryptedText.split(':')

    if (parts.length !== 3) {
      return encryptedText
    }

    const [ivHex, authTagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch {
    return encryptedText
  }
}

export const isEncrypted = (text: string): boolean => {
  if (!text) return false
  const parts = text.split(':')
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2 && parts[1].length === AUTH_TAG_LENGTH * 2
}

export const encryptSensitiveFields = <T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): T => {
  const result = { ...data }

  for (const field of fields) {
    const value = data[field]
    if (typeof value === 'string' && value && !isEncrypted(value)) {
      (result[field] as unknown) = encrypt(value)
    }
  }

  return result
}

export const decryptSensitiveFields = <T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): T => {
  const result = { ...data }

  for (const field of fields) {
    const value = data[field]
    if (typeof value === 'string' && isEncrypted(value)) {
      (result[field] as unknown) = decrypt(value)
    }
  }

  return result
}

export const hashForComparison = (text: string): string => {
  if (!text) return text
  const key = getEncryptionKey()
  const hash = scryptSync(text, key, 32)
  return hash.toString('hex')
}

export const maskSensitiveData = (text: string, visibleChars: number = 4): string => {
  if (!text || text.length <= visibleChars) return text
  const visible = text.slice(-visibleChars)
  const masked = '*'.repeat(Math.min(text.length - visibleChars, 8))
  return masked + visible
}
