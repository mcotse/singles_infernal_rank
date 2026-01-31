/**
 * Structured Logging Utility
 *
 * Production-ready logging with:
 * - Structured JSON output for machine parsing
 * - Log levels (debug, info, warn, error)
 * - Context propagation (request IDs, user context)
 * - Conditional output (verbose in dev, minimal in prod)
 * - High-cardinality fields for debugging
 *
 * Based on: https://loggingsucks.com/
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Structured log entry with required context fields
 */
export interface LogEntry {
  timestamp: string
  level: LogLevel
  event: string
  service: string
  environment: 'dev' | 'prod' | 'test'
  // Optional high-cardinality fields
  request_id?: string
  user_id?: string
  board_id?: string
  space_id?: string
  card_id?: string
  // Error context
  error_code?: string
  error_message?: string
  stack_trace?: string
  // Performance
  duration_ms?: number
  // Additional context
  [key: string]: unknown
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel
  /** Service name for all logs */
  service: string
  /** Current environment */
  environment: 'dev' | 'prod' | 'test'
  /** Enable console output */
  consoleEnabled: boolean
  /** Custom log handler for external services */
  onLog?: (entry: LogEntry) => void
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Get current environment from Vite
 */
const getEnvironment = (): 'dev' | 'prod' | 'test' => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.MODE === 'test') return 'test'
    if (import.meta.env.DEV) return 'dev'
    return 'prod'
  }
  return 'prod'
}

/**
 * Default configuration
 */
const defaultConfig: LoggerConfig = {
  minLevel: getEnvironment() === 'prod' ? 'info' : 'debug',
  service: 'hot-takes',
  environment: getEnvironment(),
  consoleEnabled: true,
}

/**
 * Current logger configuration (mutable for runtime changes)
 */
let config: LoggerConfig = { ...defaultConfig }

/**
 * Request context for correlation (thread-local equivalent)
 */
let currentContext: Partial<LogEntry> = {}

/**
 * Generate a short request ID
 */
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * Format timestamp in ISO 8601
 */
const formatTimestamp = (): string => {
  return new Date().toISOString()
}

/**
 * Sanitize data to remove sensitive fields
 */
const sanitize = (data: Record<string, unknown>): Record<string, unknown> => {
  const sensitivePatterns = ['password', 'token', 'secret', 'apikey', 'authorization', 'key']
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (sensitivePatterns.some((s) => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitize(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Check if log level should be output
 */
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.minLevel]
}

/**
 * Format log entry for console output
 */
const formatForConsole = (entry: LogEntry): string => {
  const { timestamp, level, event, duration_ms, error_message, ...rest } = entry

  // In dev, use readable format
  if (config.environment === 'dev') {
    const time = new Date(timestamp).toLocaleTimeString()
    const durationStr = duration_ms !== undefined ? ` (${duration_ms.toFixed(1)}ms)` : ''
    const errorStr = error_message ? ` - ${error_message}` : ''

    // Extract meaningful context
    const contextParts: string[] = []
    if (rest.board_id) contextParts.push(`board:${rest.board_id}`)
    if (rest.space_id) contextParts.push(`space:${rest.space_id}`)
    if (rest.request_id) contextParts.push(`req:${rest.request_id}`)

    const contextStr = contextParts.length > 0 ? ` [${contextParts.join(' ')}]` : ''

    return `[${time}] ${level.toUpperCase().padEnd(5)} ${event}${durationStr}${errorStr}${contextStr}`
  }

  // In prod, use JSON for machine parsing
  return JSON.stringify(entry)
}

/**
 * Output log entry to appropriate destination
 */
const output = (entry: LogEntry): void => {
  if (!config.consoleEnabled) return

  const formatted = formatForConsole(entry)

  switch (entry.level) {
    case 'debug':
      console.debug(formatted)
      break
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted)
      break
  }

  // Call custom handler if provided
  config.onLog?.(entry)
}

/**
 * Create a log entry with all context
 */
const createEntry = (
  level: LogLevel,
  event: string,
  data?: Record<string, unknown>
): LogEntry => {
  const sanitizedData = data ? sanitize(data) : {}

  return {
    timestamp: formatTimestamp(),
    level,
    event,
    service: config.service,
    environment: config.environment,
    ...currentContext,
    ...sanitizedData,
  }
}

/**
 * Core logging function
 */
const log = (level: LogLevel, event: string, data?: Record<string, unknown>): void => {
  if (!shouldLog(level)) return

  const entry = createEntry(level, event, data)
  output(entry)
}

// ============ Public API ============

/**
 * Configure the logger
 */
export const configureLogger = (options: Partial<LoggerConfig>): void => {
  config = { ...config, ...options }
}

/**
 * Reset logger to default configuration
 */
export const resetLoggerConfig = (): void => {
  config = { ...defaultConfig }
}

/**
 * Set context that will be included in all subsequent logs
 * Useful for request-scoped context (user_id, request_id, etc.)
 */
export const setLogContext = (context: Partial<LogEntry>): void => {
  currentContext = { ...currentContext, ...context }
}

/**
 * Clear all context
 */
export const clearLogContext = (): void => {
  currentContext = {}
}

/**
 * Create a child logger with additional fixed context
 */
export const createChildLogger = (context: Partial<LogEntry>) => {
  return {
    debug: (event: string, data?: Record<string, unknown>) =>
      log('debug', event, { ...context, ...data }),
    info: (event: string, data?: Record<string, unknown>) =>
      log('info', event, { ...context, ...data }),
    warn: (event: string, data?: Record<string, unknown>) =>
      log('warn', event, { ...context, ...data }),
    error: (event: string, data?: Record<string, unknown>) =>
      log('error', event, { ...context, ...data }),
  }
}

/**
 * Log at debug level - verbose details for development
 */
export const debug = (event: string, data?: Record<string, unknown>): void => {
  log('debug', event, data)
}

/**
 * Log at info level - normal operations worth recording
 */
export const info = (event: string, data?: Record<string, unknown>): void => {
  log('info', event, data)
}

/**
 * Log at warn level - unexpected but handled conditions
 */
export const warn = (event: string, data?: Record<string, unknown>): void => {
  log('warn', event, data)
}

/**
 * Log at error level - failures needing attention
 */
export const error = (event: string, data?: Record<string, unknown>): void => {
  log('error', event, data)
}

/**
 * Log an error with full context extraction
 */
export const logError = (
  event: string,
  err: unknown,
  data?: Record<string, unknown>
): void => {
  const errorData: Record<string, unknown> = { ...data }

  if (err instanceof Error) {
    errorData.error_message = err.message
    errorData.error_code = err.name
    // Only include stack trace in dev
    if (config.environment === 'dev') {
      errorData.stack_trace = err.stack
    }
  } else if (typeof err === 'string') {
    errorData.error_message = err
  } else {
    errorData.error_message = String(err)
  }

  log('error', event, errorData)
}

/**
 * Measure and log duration of an async operation
 */
export const withTiming = async <T>(
  event: string,
  operation: () => Promise<T>,
  data?: Record<string, unknown>
): Promise<T> => {
  const startTime = performance.now()
  const requestId = generateRequestId()

  debug(`${event}_started`, { request_id: requestId, ...data })

  try {
    const result = await operation()
    const duration = performance.now() - startTime

    info(`${event}_completed`, {
      request_id: requestId,
      duration_ms: duration,
      ...data,
    })

    return result
  } catch (err) {
    const duration = performance.now() - startTime

    logError(`${event}_failed`, err, {
      request_id: requestId,
      duration_ms: duration,
      ...data,
    })

    throw err
  }
}

/**
 * Create a timing context for manual start/end logging
 */
export const startTiming = (
  event: string,
  data?: Record<string, unknown>
): {
  requestId: string
  end: (additionalData?: Record<string, unknown>) => void
  fail: (err: unknown, additionalData?: Record<string, unknown>) => void
} => {
  const startTime = performance.now()
  const requestId = generateRequestId()

  debug(`${event}_started`, { request_id: requestId, ...data })

  return {
    requestId,
    end: (additionalData?: Record<string, unknown>) => {
      const duration = performance.now() - startTime
      info(`${event}_completed`, {
        request_id: requestId,
        duration_ms: duration,
        ...data,
        ...additionalData,
      })
    },
    fail: (err: unknown, additionalData?: Record<string, unknown>) => {
      const duration = performance.now() - startTime
      logError(`${event}_failed`, err, {
        request_id: requestId,
        duration_ms: duration,
        ...data,
        ...additionalData,
      })
    },
  }
}

// ============ Domain-Specific Loggers ============

/**
 * Logger for Firebase/API operations
 */
export const apiLogger = createChildLogger({ service: 'hot-takes:api' })

/**
 * Logger for storage operations
 */
export const storageLogger = createChildLogger({ service: 'hot-takes:storage' })

/**
 * Logger for user actions
 */
export const actionLogger = createChildLogger({ service: 'hot-takes:action' })

/**
 * Logger for performance metrics
 */
export const perfLogger = createChildLogger({ service: 'hot-takes:perf' })

// Export default logger object for convenience
export const logger = {
  debug,
  info,
  warn,
  error,
  logError,
  withTiming,
  startTiming,
  setContext: setLogContext,
  clearContext: clearLogContext,
  configure: configureLogger,
  reset: resetLoggerConfig,
  child: createChildLogger,
  api: apiLogger,
  storage: storageLogger,
  action: actionLogger,
  perf: perfLogger,
}

export default logger
