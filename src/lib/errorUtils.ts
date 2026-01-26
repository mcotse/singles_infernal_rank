/**
 * Error Utilities
 *
 * Maps technical errors to user-friendly messages.
 */

// Common Firebase/Firestore error codes and their friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'User not found.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',

  // Firestore errors
  'permission-denied': "You don't have permission to do this.",
  'not-found': 'The requested item was not found.',
  'already-exists': 'This item already exists.',
  'unavailable': 'Service temporarily unavailable. Please try again.',
  'resource-exhausted': 'Too many requests. Please slow down.',
  'deadline-exceeded': 'Request timed out. Please try again.',
  'failed-precondition': 'Action cannot be completed at this time.',
  'aborted': 'Operation was cancelled. Please try again.',
  'internal': 'An unexpected error occurred. Please try again.',
  'invalid-argument': 'Invalid request. Please check your input.',
  'unauthenticated': 'Please sign in to continue.',

  // Custom app errors
  'rate-limited': "You've reached the limit. Please try again later.",
  'already-reported': "You've already reported this.",
  'already-friends': 'You are already friends with this user.',
  'request-pending': 'A friend request is already pending.',
  'blocked-user': 'Unable to complete this action.',
}

// Default fallback message
const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.'

/**
 * Extract error code from various error types
 */
const getErrorCode = (error: unknown): string | null => {
  if (!error) return null

  // Firebase errors have a 'code' property
  if (typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code
  }

  // Check for error message patterns
  if (error instanceof Error) {
    // Firebase error format: "Firebase: Error (auth/xxx)"
    const firebaseMatch = error.message.match(/\(([^)]+)\)/)
    if (firebaseMatch) {
      return firebaseMatch[1]
    }
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return null
}

/**
 * Get a user-friendly error message from any error type
 */
export const getUserFriendlyError = (error: unknown): string => {
  if (!error) return DEFAULT_ERROR_MESSAGE

  const code = getErrorCode(error)

  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code]
  }

  // If it's an Error with a reasonable message, use it
  if (error instanceof Error && error.message && error.message.length < 100) {
    // Avoid exposing technical details
    const message = error.message.toLowerCase()
    if (
      !message.includes('firebase') &&
      !message.includes('firestore') &&
      !message.includes('undefined') &&
      !message.includes('null') &&
      !message.includes('function')
    ) {
      return error.message
    }
  }

  return DEFAULT_ERROR_MESSAGE
}

/**
 * Check if error indicates user should retry
 */
export const isRetryableError = (error: unknown): boolean => {
  const code = getErrorCode(error)
  if (!code) return false

  const retryableCodes = [
    'unavailable',
    'resource-exhausted',
    'deadline-exceeded',
    'aborted',
    'auth/network-request-failed',
  ]

  return retryableCodes.includes(code)
}

/**
 * Check if error indicates user needs to sign in
 */
export const isAuthError = (error: unknown): boolean => {
  const code = getErrorCode(error)
  if (!code) return false

  return code === 'unauthenticated' || code.startsWith('auth/')
}
