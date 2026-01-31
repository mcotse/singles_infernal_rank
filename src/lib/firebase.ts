/**
 * Firebase Configuration with Lazy Initialization
 *
 * Firebase SDK is loaded lazily to avoid bundle size impact on users
 * who don't use social features. The SDK (~100KB) is only loaded when
 * a user first accesses social functionality.
 *
 * DEV MODE:
 * In development (or when VITE_USE_MOCK_AUTH=true), Firebase is bypassed
 * and a mock authentication system is used instead. This allows testing
 * the UI flows without setting up Firebase.
 *
 * PRODUCTION Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Google Sign-In in Authentication > Sign-in method
 * 3. Create a Firestore database (start in test mode for dev)
 * 4. Create a Storage bucket
 * 5. Copy web app config from Project Settings > Your apps > Web app
 * 6. Create .env.local with VITE_FIREBASE_* variables (see below)
 */

import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'
import { apiLogger as log, startTiming } from './logger'

// Check if we should use mock auth
// - In dev: defaults to true unless VITE_USE_MOCK_AUTH=false
// - In prod: defaults to false unless VITE_USE_MOCK_AUTH=true
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'false'
  ? false
  : import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_AUTH === 'true'

// Firebase config from environment variables
// Create .env.local with these values from Firebase console:
//
// VITE_FIREBASE_API_KEY=your-api-key
// VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=your-project-id
// VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
// VITE_FIREBASE_APP_ID=your-app-id
//
// To force mock auth in production build: VITE_USE_MOCK_AUTH=true

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Lazy-loaded instances
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

// Track initialization state
let isInitializing = false
let initPromise: Promise<void> | null = null

/**
 * Check if Firebase is configured (has required env vars)
 */
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  )
}

/**
 * Initialize Firebase lazily
 * Called automatically by getter functions, but can be called manually
 * to preload Firebase when user shows intent to use social features
 */
export const initializeFirebase = async (): Promise<void> => {
  if (app) return // Already initialized
  if (isInitializing && initPromise) return initPromise // Wait for existing init

  if (!isFirebaseConfigured()) {
    log.error('firebase_init_failed', { reason: 'missing_config' })
    throw new Error(
      'Firebase is not configured. Please set VITE_FIREBASE_* environment variables.'
    )
  }

  isInitializing = true
  const timing = startTiming('firebase_init')

  initPromise = (async () => {
    try {
      const { initializeApp } = await import('firebase/app')
      const { getAuth } = await import('firebase/auth')
      const { getFirestore } = await import('firebase/firestore')
      const { getStorage } = await import('firebase/storage')

      app = initializeApp(firebaseConfig)
      auth = getAuth(app)
      db = getFirestore(app)
      storage = getStorage(app)

      isInitializing = false
      timing.end()
    } catch (err) {
      isInitializing = false
      timing.fail(err)
      throw err
    }
  })()

  return initPromise
}

/**
 * Get Firebase Auth instance (initializes Firebase if needed)
 */
export const getFirebaseAuth = async (): Promise<Auth> => {
  if (!auth) await initializeFirebase()
  if (!auth) throw new Error('Failed to initialize Firebase Auth')
  return auth
}

/**
 * Get Firestore instance (initializes Firebase if needed)
 */
export const getFirebaseDb = async (): Promise<Firestore> => {
  if (!db) await initializeFirebase()
  if (!db) throw new Error('Failed to initialize Firestore')
  return db
}

/**
 * Get Firebase Storage instance (initializes Firebase if needed)
 */
export const getFirebaseStorage = async (): Promise<FirebaseStorage> => {
  if (!storage) await initializeFirebase()
  if (!storage) throw new Error('Failed to initialize Firebase Storage')
  return storage
}

/**
 * Get Firebase App instance (initializes Firebase if needed)
 */
export const getFirebaseApp = async (): Promise<FirebaseApp> => {
  if (!app) await initializeFirebase()
  if (!app) throw new Error('Failed to initialize Firebase')
  return app
}

/**
 * Check if Firebase is currently initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return app !== null
}

/**
 * Initialize anonymous authentication silently.
 * No UI shown — used for Firestore security rules.
 * Returns the anonymous user's UID.
 */
export const initializeAnonymousAuth = async (): Promise<string> => {
  const timing = startTiming('anonymous_auth_init')

  try {
    const auth = await getFirebaseAuth()
    const { signInAnonymously } = await import('firebase/auth')

    // If already signed in anonymously, return existing UID
    if (auth.currentUser) {
      log.debug('anonymous_auth_existing', { has_user: true })
      timing.end({ cached: true })
      return auth.currentUser.uid
    }

    const result = await signInAnonymously(auth)
    timing.end({ cached: false })
    return result.user.uid
  } catch (err) {
    timing.fail(err)
    throw err
  }
}

/**
 * Get current anonymous UID if signed in, or null
 */
export const getAnonUid = async (): Promise<string | null> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, use a stable fake UID from localStorage
    const mockUid = localStorage.getItem('singles-infernal-rank:mock-anon-uid')
    if (mockUid) return mockUid
    const uid = crypto.randomUUID()
    localStorage.setItem('singles-infernal-rank:mock-anon-uid', uid)
    return uid
  }

  try {
    const auth = await getFirebaseAuth()
    return auth.currentUser?.uid ?? null
  } catch {
    return null
  }
}

/**
 * Reset Firebase (for testing purposes)
 */
export const resetFirebase = (): void => {
  app = null
  auth = null
  db = null
  storage = null
  isInitializing = false
  initPromise = null
}
