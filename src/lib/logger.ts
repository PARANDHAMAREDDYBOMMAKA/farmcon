type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const getMinLogLevel = (): LogLevel => {
  const env = process.env.LOG_LEVEL?.toLowerCase()
  if (env && env in LOG_LEVELS) {
    return env as LogLevel
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

const formatMessage = (level: LogLevel, message: string, context?: LogContext): string => {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLogLevel()]
}

const sanitizeContext = (context?: LogContext): LogContext | undefined => {
  if (!context) return undefined

  const sanitized: LogContext = {}
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'aadhar', 'pan', 'bank', 'account']

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))

    if (isSensitive && typeof value === 'string') {
      sanitized[key] = '[REDACTED]'
    } else if (value instanceof Error) {
      sanitized[key] = {
        name: value.name,
        message: value.message,
        stack: process.env.NODE_ENV !== 'production' ? value.stack : undefined,
      }
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

type Logger = {
  debug: (message: string, context?: LogContext) => void
  info: (message: string, context?: LogContext) => void
  warn: (message: string, context?: LogContext) => void
  error: (message: string, context?: LogContext) => void
  child: (ctx: LogContext) => Logger
}

function createLogger(baseContext?: LogContext): Logger {
  const merge = (ctx?: LogContext) =>
    baseContext ? { ...baseContext, ...(ctx || {}) } : ctx

  return {
    debug: (message, context) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message, sanitizeContext(merge(context))))
      }
    },
    info: (message, context) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', message, sanitizeContext(merge(context))))
      }
    },
    warn: (message, context) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message, sanitizeContext(merge(context))))
      }
    },
    error: (message, context) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message, sanitizeContext(merge(context))))
      }
    },
    child: (ctx) => createLogger(merge(ctx)),
  }
}

export const logger: Logger = createLogger()

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function getRequestId(headers: Headers): string {
  return headers.get('x-request-id') || generateRequestId()
}
