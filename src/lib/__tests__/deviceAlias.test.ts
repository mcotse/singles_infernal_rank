import { describe, it, expect } from 'vitest'
import { generateDeviceAlias } from '../deviceAlias'

describe('generateDeviceAlias', () => {
  it('is deterministic — same token always produces same alias', () => {
    const token = 'abc-123-def-456'
    expect(generateDeviceAlias(token)).toBe(generateDeviceAlias(token))
  })

  it('returns "Adjective Animal" format (two capitalized words)', () => {
    const alias = generateDeviceAlias('test-token')
    const parts = alias.split(' ')
    expect(parts).toHaveLength(2)
    expect(parts[0]).toMatch(/^[A-Z][a-z]+$/)
    expect(parts[1]).toMatch(/^[A-Z][a-z]+$/)
  })

  it('produces different aliases for different tokens', () => {
    const aliases = new Set<string>()
    for (let i = 0; i < 100; i++) {
      aliases.add(generateDeviceAlias(`token-${i}`))
    }
    // With 2500 combos and 100 tokens, collisions are very unlikely
    expect(aliases.size).toBeGreaterThanOrEqual(90)
  })

  it('handles empty string', () => {
    const alias = generateDeviceAlias('')
    expect(alias).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
  })

  it('handles very long string', () => {
    const alias = generateDeviceAlias('x'.repeat(10000))
    expect(alias).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
  })
})
