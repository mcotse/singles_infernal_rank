import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  logger,
  debug,
  info,
  warn,
  error,
  logError,
  withTiming,
  startTiming,
  setLogContext,
  clearLogContext,
  configureLogger,
  resetLoggerConfig,
  createChildLogger,
} from './logger'

describe('logger', () => {
  beforeEach(() => {
    resetLoggerConfig()
    clearLogContext()
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('log levels', () => {
    it('logs debug messages in dev mode', () => {
      configureLogger({ minLevel: 'debug' })
      debug('test_event', { foo: 'bar' })
      expect(console.debug).toHaveBeenCalled()
    })

    it('logs info messages', () => {
      info('user_action', { action: 'click' })
      expect(console.info).toHaveBeenCalled()
    })

    it('logs warn messages', () => {
      warn('rate_limit_approaching', { remaining: 5 })
      expect(console.warn).toHaveBeenCalled()
    })

    it('logs error messages', () => {
      error('operation_failed', { reason: 'timeout' })
      expect(console.error).toHaveBeenCalled()
    })

    it('respects minimum log level', () => {
      configureLogger({ minLevel: 'warn' })
      debug('should_not_log')
      info('should_not_log')
      expect(console.debug).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()

      warn('should_log')
      error('should_log')
      expect(console.warn).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('logError', () => {
    it('extracts Error properties', () => {
      const testError = new Error('Something went wrong')
      testError.name = 'TestError'

      logError('database_error', testError, { table: 'users' })

      expect(console.error).toHaveBeenCalled()
      const logCall = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(logCall).toContain('database_error')
    })

    it('handles string errors', () => {
      logError('api_error', 'Connection refused')

      expect(console.error).toHaveBeenCalled()
    })

    it('handles unknown error types', () => {
      logError('unknown_error', { code: 500 })

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('context propagation', () => {
    it('includes context in all logs', () => {
      setLogContext({ user_id: 'user-123', board_id: 'board-456' })

      info('board_updated')

      const logCall = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(logCall).toContain('board_updated')
    })

    it('clears context', () => {
      setLogContext({ user_id: 'user-123' })
      clearLogContext()

      info('after_clear')

      expect(console.info).toHaveBeenCalled()
    })

    it('merges additional context', () => {
      setLogContext({ user_id: 'user-123' })
      setLogContext({ request_id: 'req-abc' })

      info('merged_context')

      expect(console.info).toHaveBeenCalled()
    })
  })

  describe('child logger', () => {
    it('creates child with fixed context', () => {
      const boardLogger = createChildLogger({ board_id: 'board-123' })

      boardLogger.info('card_added', { card_id: 'card-456' })

      expect(console.info).toHaveBeenCalled()
    })

    it('supports all log levels', () => {
      configureLogger({ minLevel: 'debug' })
      const child = createChildLogger({ space_id: 'space-789' })

      child.debug('debug_msg')
      child.info('info_msg')
      child.warn('warn_msg')
      child.error('error_msg')

      expect(console.debug).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('withTiming', () => {
    it('logs start and completion with duration', async () => {
      configureLogger({ minLevel: 'debug' })

      const result = await withTiming(
        'fetch_data',
        async () => {
          await new Promise((r) => setTimeout(r, 10))
          return 'success'
        },
        { endpoint: '/api/data' }
      )

      expect(result).toBe('success')
      expect(console.debug).toHaveBeenCalled() // started
      expect(console.info).toHaveBeenCalled() // completed
    })

    it('logs failure with duration on error', async () => {
      configureLogger({ minLevel: 'debug' })

      await expect(
        withTiming('failing_operation', async () => {
          throw new Error('Intentional failure')
        })
      ).rejects.toThrow('Intentional failure')

      expect(console.debug).toHaveBeenCalled() // started
      expect(console.error).toHaveBeenCalled() // failed
    })
  })

  describe('startTiming', () => {
    it('allows manual end timing', async () => {
      configureLogger({ minLevel: 'debug' })

      const timing = startTiming('manual_operation', { step: 'init' })

      await new Promise((r) => setTimeout(r, 5))
      timing.end({ result: 'done' })

      expect(console.debug).toHaveBeenCalled() // started
      expect(console.info).toHaveBeenCalled() // completed
    })

    it('allows manual fail timing', () => {
      configureLogger({ minLevel: 'debug' })

      const timing = startTiming('failing_manual')
      timing.fail(new Error('Manual failure'), { context: 'test' })

      expect(console.debug).toHaveBeenCalled() // started
      expect(console.error).toHaveBeenCalled() // failed
    })

    it('provides request ID', () => {
      const timing = startTiming('with_request_id')
      expect(timing.requestId).toMatch(/^[a-z0-9]+$/)
    })
  })

  describe('sensitive data sanitization', () => {
    it('redacts sensitive fields', () => {
      info('login_attempt', {
        username: 'testuser',
        password: 'secret123',
        apiKey: 'key-abc',
      })

      expect(console.info).toHaveBeenCalled()
      const logCall = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(logCall).not.toContain('secret123')
      expect(logCall).not.toContain('key-abc')
    })
  })

  describe('configuration', () => {
    it('can disable console output', () => {
      configureLogger({ consoleEnabled: false })

      info('silent_log')

      expect(console.info).not.toHaveBeenCalled()
    })

    it('calls custom onLog handler', () => {
      const customHandler = vi.fn()
      configureLogger({ onLog: customHandler })

      info('custom_handler_test', { data: 123 })

      expect(customHandler).toHaveBeenCalled()
      const entry = customHandler.mock.calls[0][0]
      expect(entry.event).toBe('custom_handler_test')
      expect(entry.data).toBe(123)
    })

    it('resets to default config', () => {
      configureLogger({ minLevel: 'error', consoleEnabled: false })
      resetLoggerConfig()

      info('after_reset')

      // Should log again after reset (default is info in test env)
      expect(console.info).toHaveBeenCalled()
    })
  })

  describe('logger object', () => {
    it('exposes all functions', () => {
      expect(logger.debug).toBeDefined()
      expect(logger.info).toBeDefined()
      expect(logger.warn).toBeDefined()
      expect(logger.error).toBeDefined()
      expect(logger.logError).toBeDefined()
      expect(logger.withTiming).toBeDefined()
      expect(logger.startTiming).toBeDefined()
      expect(logger.setContext).toBeDefined()
      expect(logger.clearContext).toBeDefined()
      expect(logger.configure).toBeDefined()
      expect(logger.reset).toBeDefined()
      expect(logger.child).toBeDefined()
    })

    it('exposes domain-specific loggers', () => {
      expect(logger.api).toBeDefined()
      expect(logger.storage).toBeDefined()
      expect(logger.action).toBeDefined()
      expect(logger.perf).toBeDefined()
    })
  })
})
