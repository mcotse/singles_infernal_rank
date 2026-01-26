/**
 * Username Validation Utilities
 *
 * Rules for valid usernames:
 * - 3-20 characters
 * - Only letters (a-z, A-Z), numbers (0-9), and underscores (_)
 * - Must start and end with a letter or number
 * - No consecutive underscores
 */

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/

/** Reserved usernames that cannot be claimed by users */
export const RESERVED_USERNAMES = new Set([
  // System/admin
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'help',
  'mod',
  'moderator',
  'staff',
  // App-specific
  'hottakes',
  'ranking',
  'rankings',
  'official',
  'team',
  // Common reserved
  'null',
  'undefined',
  'anonymous',
  'unknown',
  'user',
  'guest',
  'test',
  'demo',
  'api',
  'www',
  'mail',
  'email',
  'info',
  'contact',
])

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate a username against all rules
 */
export const validateUsername = (username: string): ValidationResult => {
  const trimmed = username.trim()

  // Check for empty
  if (!trimmed) {
    return { isValid: false, error: 'Username is required' }
  }

  // Check minimum length
  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    }
  }

  // Check maximum length
  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
    }
  }

  // Check character pattern
  if (!USERNAME_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    }
  }

  // Check start character (must be alphanumeric)
  if (trimmed.startsWith('_')) {
    return {
      isValid: false,
      error: 'Username must start with a letter or number',
    }
  }

  // Check end character (must be alphanumeric)
  if (trimmed.endsWith('_')) {
    return {
      isValid: false,
      error: 'Username must end with a letter or number',
    }
  }

  // Check for consecutive underscores
  if (trimmed.includes('__')) {
    return {
      isValid: false,
      error: 'Username cannot have consecutive underscores',
    }
  }

  // Check for reserved usernames
  if (RESERVED_USERNAMES.has(trimmed.toLowerCase())) {
    return {
      isValid: false,
      error: 'This username is reserved',
    }
  }

  return { isValid: true }
}

/**
 * Normalize username for comparison (lowercase, trimmed)
 */
export const normalizeUsername = (username: string): string => {
  return username.trim().toLowerCase()
}

/**
 * Check if a username is available
 * Uses mock storage in dev mode, Firestore in production
 */
export const checkUsernameAvailability = async (
  username: string
): Promise<{ available: boolean; error?: string }> => {
  const validation = validateUsername(username)
  if (!validation.isValid) {
    return { available: false, error: validation.error }
  }

  try {
    const { USE_MOCK_AUTH } = await import('./firebase')

    if (USE_MOCK_AUTH) {
      const { checkMockUsernameAvailability } = await import('./mockAuth')
      return checkMockUsernameAvailability(username)
    }

    const { getFirebaseDb } = await import('./firebase')
    const { doc, getDoc } = await import('firebase/firestore')

    const db = await getFirebaseDb()
    const normalized = normalizeUsername(username)
    const usernameDoc = await getDoc(doc(db, 'usernames', normalized))

    if (usernameDoc.exists()) {
      return { available: false, error: 'Username is already taken' }
    }

    return { available: true }
  } catch (error) {
    console.error('Error checking username availability:', error)
    return { available: false, error: 'Failed to check username availability' }
  }
}

/**
 * Reserve a username for a user (must be called in a transaction)
 * Returns true if successful, false if already taken
 */
export const reserveUsername = async (
  username: string,
  uid: string
): Promise<{ success: boolean; error?: string }> => {
  const validation = validateUsername(username)
  if (!validation.isValid) {
    return { success: false, error: validation.error }
  }

  try {
    const { getFirebaseDb } = await import('./firebase')
    const { doc, runTransaction } = await import('firebase/firestore')

    const db = await getFirebaseDb()
    const normalized = normalizeUsername(username)

    const success = await runTransaction(db, async (transaction) => {
      const usernameRef = doc(db, 'usernames', normalized)
      const usernameDoc = await transaction.get(usernameRef)

      if (usernameDoc.exists()) {
        return false // Already taken
      }

      // Reserve the username
      transaction.set(usernameRef, {
        uid,
        username, // Store original casing
        createdAt: new Date(),
      })

      return true
    })

    if (!success) {
      return { success: false, error: 'Username is already taken' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reserving username:', error)
    return { success: false, error: 'Failed to reserve username' }
  }
}
