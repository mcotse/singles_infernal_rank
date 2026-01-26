import { describe, it, expect } from 'vitest'
import {
  validateUsername,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_PATTERN,
  RESERVED_USERNAMES,
} from './usernameValidation'

describe('usernameValidation', () => {
  describe('constants', () => {
    it('has correct length bounds', () => {
      expect(USERNAME_MIN_LENGTH).toBe(3)
      expect(USERNAME_MAX_LENGTH).toBe(20)
    })

    it('has correct pattern', () => {
      expect(USERNAME_PATTERN).toEqual(/^[a-zA-Z0-9_]+$/)
    })
  })

  describe('validateUsername', () => {
    describe('valid usernames', () => {
      it('accepts lowercase letters', () => {
        expect(validateUsername('johndoe')).toEqual({ isValid: true })
      })

      it('accepts uppercase letters', () => {
        expect(validateUsername('JohnDoe')).toEqual({ isValid: true })
      })

      it('accepts numbers', () => {
        expect(validateUsername('john123')).toEqual({ isValid: true })
      })

      it('accepts underscores', () => {
        expect(validateUsername('john_doe')).toEqual({ isValid: true })
      })

      it('accepts mixed characters', () => {
        expect(validateUsername('John_Doe_123')).toEqual({ isValid: true })
      })

      it('accepts minimum length (3)', () => {
        expect(validateUsername('abc')).toEqual({ isValid: true })
      })

      it('accepts maximum length (20)', () => {
        expect(validateUsername('a'.repeat(20))).toEqual({ isValid: true })
      })
    })

    describe('invalid usernames', () => {
      it('rejects empty string', () => {
        const result = validateUsername('')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username is required')
      })

      it('rejects too short (< 3)', () => {
        const result = validateUsername('ab')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username must be at least 3 characters')
      })

      it('rejects too long (> 20)', () => {
        const result = validateUsername('a'.repeat(21))
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username must be at most 20 characters')
      })

      it('rejects spaces', () => {
        const result = validateUsername('john doe')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username can only contain letters, numbers, and underscores')
      })

      it('rejects hyphens', () => {
        const result = validateUsername('john-doe')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username can only contain letters, numbers, and underscores')
      })

      it('rejects dots', () => {
        const result = validateUsername('john.doe')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username can only contain letters, numbers, and underscores')
      })

      it('rejects special characters', () => {
        const result = validateUsername('john@doe')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username can only contain letters, numbers, and underscores')
      })

      it('rejects emoji', () => {
        const result = validateUsername('john🔥')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username can only contain letters, numbers, and underscores')
      })
    })

    describe('edge cases', () => {
      it('trims whitespace before validation', () => {
        expect(validateUsername('  johndoe  ')).toEqual({ isValid: true })
      })

      it('rejects only whitespace', () => {
        const result = validateUsername('   ')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username is required')
      })

      it('rejects starting with underscore', () => {
        const result = validateUsername('_johndoe')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username must start with a letter or number')
      })

      it('rejects ending with underscore', () => {
        const result = validateUsername('johndoe_')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username must end with a letter or number')
      })

      it('rejects consecutive underscores', () => {
        const result = validateUsername('john__doe')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Username cannot have consecutive underscores')
      })
    })

    describe('reserved usernames', () => {
      it('rejects "admin"', () => {
        const result = validateUsername('admin')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('This username is reserved')
      })

      it('rejects "Admin" (case insensitive)', () => {
        const result = validateUsername('Admin')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('This username is reserved')
      })

      it('rejects "support"', () => {
        const result = validateUsername('support')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('This username is reserved')
      })

      it('rejects "root"', () => {
        const result = validateUsername('root')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('This username is reserved')
      })

      it('rejects app-specific reserved names', () => {
        const result = validateUsername('ranky')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('This username is reserved')
      })

      it('has a reasonable set of reserved names', () => {
        // Should have common system/admin names
        expect(RESERVED_USERNAMES.has('admin')).toBe(true)
        expect(RESERVED_USERNAMES.has('root')).toBe(true)
        expect(RESERVED_USERNAMES.has('support')).toBe(true)
        // Should not be overly restrictive
        expect(RESERVED_USERNAMES.size).toBeLessThan(50)
      })
    })
  })
})
