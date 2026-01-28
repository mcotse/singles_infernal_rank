import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase module before importing the module under test
vi.mock('../firebase', () => ({
  USE_MOCK_AUTH: true,
  getFirebaseDb: vi.fn(),
}))

vi.mock('../deviceAlias', () => ({
  generateDeviceAlias: vi.fn(() => 'Swift Falcon'),
}))

import { getOrCreateDeviceAlias } from '../firestoreDeviceAlias'

describe('getOrCreateDeviceAlias (mock mode)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates alias on first call and stores in localStorage', async () => {
    const alias = await getOrCreateDeviceAlias('test-token')
    expect(alias).toBe('Swift Falcon')
    expect(localStorage.getItem('singles-infernal-rank:device-alias')).toBe('Swift Falcon')
  })

  it('reads existing alias from localStorage on subsequent calls', async () => {
    localStorage.setItem('singles-infernal-rank:device-alias', 'Brave Otter')
    const alias = await getOrCreateDeviceAlias('test-token')
    expect(alias).toBe('Brave Otter')
  })
})
