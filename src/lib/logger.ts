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

export const logger = {
  debug: (message: string, context?: LogContext): void => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, sanitizeContext(context)))
    }
  },

  info: (message: string, context?: LogContext): void => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, sanitizeContext(context)))
    }
  },

  warn: (message: string, context?: LogContext): void => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, sanitizeContext(context)))
    }
  },

  error: (message: string, context?: LogContext): void => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, sanitizeContext(context)))
    }
  },
}
