/**
 * Mock Authentication for Development
 *
 * Simulates Firebase auth for local development without requiring
 * Firebase project setup. Data is stored in localStorage.
 *
 * Features:
 * - Simulated sign-in with a fake Google user
 * - Profile stored in localStorage
 * - Username uniqueness checked against localStorage
 */

import type { UserProfile } from './socialTypes'
import type { Timestamp } from 'firebase/firestore'

/** Create a mock Timestamp that matches Firebase's Timestamp interface */
export const createMockTimestamp = (ms: number): Timestamp => ({
  seconds: Math.floor(ms / 1000),
  nanoseconds: (ms % 1000) * 1e6,
  toDate: () => new Date(ms),
  toMillis: () => ms,
  isEqual: (other: Timestamp) => other.toMillis() === ms,
  valueOf: () => `Timestamp(seconds=${Math.floor(ms / 1000)}, nanoseconds=${(ms % 1000) * 1e6})`,
  toJSON: () => ({ seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6, type: 'Timestamp' }),
})

const MOCK_AUTH_KEY = 'mock-auth-user'
const MOCK_PROFILES_KEY = 'mock-user-profiles'
const MOCK_USERNAMES_KEY = 'mock-usernames'

// Simulated user after "Google Sign-In"
export interface MockUser {
  uid: string
  email: string
  displayName: string
  photoURL: string
}

// Auth state change listeners
type AuthCallback = (user: MockUser | null) => void
const authListeners: Set<AuthCallback> = new Set()

/**
 * Get current mock user from localStorage
 */
export const getMockUser = (): MockUser | null => {
  const stored = localStorage.getItem(MOCK_AUTH_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as MockUser
  } catch {
    return null
  }
}

/**
 * Notify all auth listeners of state change
 */
const notifyAuthListeners = (user: MockUser | null) => {
  authListeners.forEach((callback) => callback(user))
}

/**
 * Subscribe to auth state changes
 */
export const onMockAuthStateChanged = (callback: AuthCallback): (() => void) => {
  authListeners.add(callback)
  // Immediately call with current state
  callback(getMockUser())
  // Return unsubscribe function
  return () => authListeners.delete(callback)
}

/**
 * Simulate Google Sign-In
 * Creates a fake user with random-ish data
 */
export const mockSignInWithGoogle = async (): Promise<MockUser> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Generate a "random" user (but consistent across sessions for the same browser)
  const existingUser = getMockUser()
  if (existingUser) {
    notifyAuthListeners(existingUser)
    return existingUser
  }

  // Create new mock user
  const uid = `mock-${crypto.randomUUID().slice(0, 8)}`
  const mockUser: MockUser = {
    uid,
    email: `dev.user.${uid.slice(5)}@example.com`,
    displayName: 'Dev User',
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
  }

  localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(mockUser))
  notifyAuthListeners(mockUser)
  return mockUser
}

/**
 * Simulate sign out
 */
export const mockSignOut = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200))
  localStorage.removeItem(MOCK_AUTH_KEY)
  notifyAuthListeners(null)
}

/**
 * Get all mock profiles (simulates Firestore)
 */
const getMockProfiles = (): Record<string, UserProfile> => {
  const stored = localStorage.getItem(MOCK_PROFILES_KEY)
  if (!stored) return {}
  try {
    return JSON.parse(stored) as Record<string, UserProfile>
  } catch {
    return {}
  }
}

/**
 * Save mock profiles
 */
const saveMockProfiles = (profiles: Record<string, UserProfile>) => {
  localStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(profiles))
}

/**
 * Get mock usernames map (username -> uid)
 */
const getMockUsernames = (): Record<string, string> => {
  const stored = localStorage.getItem(MOCK_USERNAMES_KEY)
  if (!stored) return {}
  try {
    return JSON.parse(stored) as Record<string, string>
  } catch {
    return {}
  }
}

/**
 * Save mock usernames
 */
const saveMockUsernames = (usernames: Record<string, string>) => {
  localStorage.setItem(MOCK_USERNAMES_KEY, JSON.stringify(usernames))
}

/**
 * Get user profile by UID
 */
export const getMockProfile = async (uid: string): Promise<UserProfile | null> => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const profiles = getMockProfiles()
  return profiles[uid] || null
}

/**
 * Check if username is available
 */
export const checkMockUsernameAvailability = async (
  username: string
): Promise<{ available: boolean; error?: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const usernames = getMockUsernames()
  const normalized = username.toLowerCase()

  if (usernames[normalized]) {
    return { available: false, error: 'Username is already taken' }
  }
  return { available: true }
}

/**
 * Reserve username and create profile
 */
export const createMockProfile = async (
  uid: string,
  username: string,
  displayName: string,
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const usernames = getMockUsernames()
  const normalized = username.toLowerCase()

  // Check availability again (race condition protection)
  if (usernames[normalized]) {
    return { success: false, error: 'Username is already taken' }
  }

  // Reserve username
  usernames[normalized] = uid
  saveMockUsernames(usernames)

  // Create profile
  const profiles = getMockProfiles()
  const now = Date.now()
  const timestamp = createMockTimestamp(now)
  profiles[uid] = {
    uid,
    username,
    displayName,
    avatarUrl,
    isSearchable: true,
    blockedUsers: [],
    createdAt: timestamp,
    lastActive: timestamp,
  }
  saveMockProfiles(profiles)

  return { success: true }
}

/**
 * Clear all mock auth data (for testing)
 */
export const clearMockAuthData = () => {
  localStorage.removeItem(MOCK_AUTH_KEY)
  localStorage.removeItem(MOCK_PROFILES_KEY)
  localStorage.removeItem(MOCK_USERNAMES_KEY)
  notifyAuthListeners(null)
}
