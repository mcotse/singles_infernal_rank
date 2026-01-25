/**
 * useAuth Hook
 *
 * Manages Firebase authentication state with Google Sign-In.
 * Handles user profile loading/creation and username setup flow.
 */

import { useState, useEffect, useCallback } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../lib/socialTypes'
import {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from '../lib/firebase'

export interface UseAuthReturn {
  /** Firebase User object (null if not signed in) */
  user: User | null
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
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)

  // Derived state: user signed in but no profile yet
  const needsUsername = user !== null && profile === null && !isLoading

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load user profile from Firestore
  const loadProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
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
    if (!isFirebaseConfigured()) {
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
          setIsListening(true)
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

  // Sign in with Google
  const signIn = useCallback(async (): Promise<void> => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured')
      return
    }

    setIsLoading(true)
    setError(null)

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
  const createProfile = useCallback(
    async (username: string): Promise<boolean> => {
      if (!user) {
        setError('Must be signed in to create profile')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const { reserveUsername } = await import('../lib/usernameValidation')
        const { getFirebaseDb } = await import('../lib/firebase')
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

        // First, reserve the username
        const reserveResult = await reserveUsername(username, user.uid)
        if (!reserveResult.success) {
          setError(reserveResult.error || 'Failed to reserve username')
          return false
        }

        // Create the user profile
        const db = await getFirebaseDb()
        const newProfile: Omit<UserProfile, 'createdAt' | 'lastActive'> & {
          createdAt: ReturnType<typeof serverTimestamp>
          lastActive: ReturnType<typeof serverTimestamp>
        } = {
          uid: user.uid,
          username,
          displayName: user.displayName || username,
          avatarUrl: user.photoURL || '',
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
    createProfile,
    clearError,
  }
}
