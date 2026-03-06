import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  MEILISEARCH_HOST: z.string().url().optional(),
  MEILISEARCH_API_KEY: z.string().optional(),

  ENCRYPTION_SECRET: z.string().min(32).optional(),
  ENCRYPTION_SALT: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
})

export type Env = z.infer<typeof envSchema>

let validatedEnv: Env | null = null

export const validateEnv = (): Env => {
  if (validatedEnv) return validatedEnv

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const missingVars = Object.entries(errors)
      .map(([key, messages]) => `  ${key}: ${messages?.join(', ')}`)
      .join('\n')

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment validation failed:\n${missingVars}`)
    }

    console.warn(`Environment validation warnings:\n${missingVars}`)

    validatedEnv = parsed.data as Env
    return validatedEnv
  }

  validatedEnv = parsed.data
  return validatedEnv
}

export const getEnv = <K extends keyof Env>(key: K): Env[K] => {
  const env = validateEnv()
  return env[key]
}

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production'
}

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

export const hasEncryption = (): boolean => {
  return !!process.env.ENCRYPTION_SECRET && process.env.ENCRYPTION_SECRET.length >= 32
}

export const hasRedis = (): boolean => {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN
}

export const hasStripe = (): boolean => {
  return !!process.env.STRIPE_SECRET_KEY
}

export const hasMeilisearch = (): boolean => {
  return !!process.env.MEILISEARCH_HOST && !!process.env.MEILISEARCH_API_KEY
}
