/**
 * useAuth Hook
 *
 * Manages authentication state with Google Sign-In.
 *
 * In development mode (or when VITE_USE_MOCK_AUTH=true), uses a mock
 * authentication system stored in localStorage. This allows testing
 * the full auth flow without Firebase setup.
 *
 * In production, uses Firebase Authentication and Firestore.
 */

import { useState, useEffect, useCallback } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../lib/socialTypes'
import {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
  USE_MOCK_AUTH,
} from '../lib/firebase'
import {
  getMockProfile,
  mockSignInWithGoogle,
  mockSignOut,
  onMockAuthStateChanged,
  createMockProfile,
  type MockUser,
} from '../lib/mockAuth'
import { validateUsername, reserveUsername } from '../lib/usernameValidation'

export interface UseAuthReturn {
  /** Firebase User object (null if not signed in) */
  user: User | MockUser | null
  /** User profile from Firestore (null if not loaded/exists) */
  profile: UserProfile | null
  /** Whether auth state is being determined */
  isLoading: boolean
  /** Error message if auth failed */
  error: string | null
  /** Whether user needs to set up username (signed in but no profile) */
  needsUsername: boolean
  /** Sign in with Google */
  signIn: () => Promise<void>
  /** Sign out */
  signOut: () => Promise<void>
  /** Create profile with username after first sign-in */
  createProfile: (username: string) => Promise<boolean>
  /** Clear error */
  clearError: () => void
  /** Whether using mock auth (dev mode) */
  isMockAuth: boolean
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | MockUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  // Start as true to prevent flash of unauthenticated content while checking auth state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Derived state: user signed in but no profile yet
  const needsUsername = user !== null && profile === null && !isLoading

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load user profile from Firestore (or mock storage)
  const loadProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    if (USE_MOCK_AUTH) {
      return getMockProfile(uid)
    }

    try {
      const db = await getFirebaseDb()
      const { doc, getDoc } = await import('firebase/firestore')

      const profileDoc = await getDoc(doc(db, 'users', uid))
      if (profileDoc.exists()) {
        return profileDoc.data() as UserProfile
      }
      return null
    } catch (err) {
      console.error('Error loading profile:', err)
      return null
    }
  }, [])

  // Set up auth state listener
  useEffect(() => {
    // Mock auth mode
    if (USE_MOCK_AUTH) {
      setIsLoading(true)
      const unsubscribe = onMockAuthStateChanged(async (mockUser) => {
        setUser(mockUser)
        if (mockUser) {
          const userProfile = await loadProfile(mockUser.uid)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      })
      return unsubscribe
    }

    // Firebase auth mode
    if (!isFirebaseConfigured()) {
      // Firebase not configured - no auth possible
      setIsLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined

    const setupListener = async () => {
      setIsLoading(true)

      try {
        const auth = await getFirebaseAuth()
        const { onAuthStateChanged } = await import('firebase/auth')

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setUser(firebaseUser)

          if (firebaseUser) {
            const userProfile = await loadProfile(firebaseUser.uid)
            setProfile(userProfile)
          } else {
            setProfile(null)
          }

          setIsLoading(false)
        })
      } catch (err) {
        console.error('Error setting up auth listener:', err)
        setError('Failed to initialize authentication')
        setIsLoading(false)
      }
    }

    setupListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [loadProfile])

  // Sign in with Google (or mock)
  const signIn = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    // Mock auth mode
    if (USE_MOCK_AUTH) {
      try {
        const mockUser = await mockSignInWithGoogle()
        const userProfile = await loadProfile(mockUser.uid)
        setProfile(userProfile)
      } catch (err) {
        console.error('Mock sign in error:', err)
        setError('Failed to sign in')
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Firebase auth mode
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured')
      setIsLoading(false)
      return
    }

    try {
      const auth = await getFirebaseAuth()
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')

      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      // Check if user has a profile
      const userProfile = await loadProfile(result.user.uid)
      setProfile(userProfile)
      // needsUsername will be true if profile is null
    } catch (err) {
      console.error('Sign in error:', err)
      if (err instanceof Error) {
        if (err.message.includes('popup-closed-by-user')) {
          // User closed popup, not an error
          return
        }
        setError(err.message)
      } else {
        setError('Failed to sign in')
      }
    } finally {
      setIsLoading(false)
    }
  }, [loadProfile])

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    // Mock auth mode
    if (USE_MOCK_AUTH) {
      try {
        await mockSignOut()
        setUser(null)
        setProfile(null)
      } catch (err) {
        console.error('Mock sign out error:', err)
        setError('Failed to sign out')
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Firebase auth mode
    try {
      const auth = await getFirebaseAuth()
      const { signOut: firebaseSignOut } = await import('firebase/auth')

      await firebaseSignOut(auth)
      setUser(null)
      setProfile(null)
    } catch (err) {
      console.error('Sign out error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to sign out')
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Create profile with username
  const createProfileFn = useCallback(
    async (username: string): Promise<boolean> => {
      if (!user) {
        setError('Must be signed in to create profile')
        return false
      }

      setIsLoading(true)
      setError(null)

      // Mock auth mode
      if (USE_MOCK_AUTH) {
        try {
          // Validate first
          const validation = validateUsername(username)
          if (!validation.isValid) {
            setError(validation.error || 'Invalid username')
            return false
          }

          const result = await createMockProfile(
            user.uid,
            username,
            ('displayName' in user && user.displayName) ? user.displayName : username,
            ('photoURL' in user && user.photoURL) ? user.photoURL : ''
          )

          if (!result.success) {
            setError(result.error || 'Failed to create profile')
            return false
          }

          // Reload profile
          const loadedProfile = await loadProfile(user.uid)
          setProfile(loadedProfile)
          return true
        } catch (err) {
          console.error('Error creating mock profile:', err)
          setError('Failed to create profile')
          return false
        } finally {
          setIsLoading(false)
        }
      }

      // Firebase auth mode
      try {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

        // First, reserve the username
        const reserveResult = await reserveUsername(username, user.uid)
        if (!reserveResult.success) {
          setError(reserveResult.error || 'Failed to reserve username')
          return false
        }

        // Create the user profile
        const db = await getFirebaseDb()
        const firebaseUser = user as User
        const newProfile: Omit<UserProfile, 'createdAt' | 'lastActive'> & {
          createdAt: ReturnType<typeof serverTimestamp>
          lastActive: ReturnType<typeof serverTimestamp>
        } = {
          uid: user.uid,
          username,
          displayName: firebaseUser.displayName || username,
          avatarUrl: firebaseUser.photoURL || '',
          isSearchable: true,
          blockedUsers: [],
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        }

        await setDoc(doc(db, 'users', user.uid), newProfile)

        // Reload profile
        const loadedProfile = await loadProfile(user.uid)
        setProfile(loadedProfile)

        return true
      } catch (err) {
        console.error('Error creating profile:', err)
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Failed to create profile')
        }
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [user, loadProfile]
  )

  return {
    user,
    profile,
    isLoading,
    error,
    needsUsername,
    signIn,
    signOut,
    createProfile: createProfileFn,
    clearError,
    isMockAuth: USE_MOCK_AUTH,
  }
}
