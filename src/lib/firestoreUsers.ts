/**
 * Firestore User Service
 *
 * Provides user profile operations for Firestore.
 */

import type { UserProfile } from './socialTypes'
import { getFirebaseDb, USE_MOCK_AUTH } from './firebase'

/**
 * Get multiple user profiles by their UIDs
 */
export const getUsersByIds = async (uids: string[]): Promise<UserProfile[]> => {
  if (uids.length === 0) return []

  if (USE_MOCK_AUTH) {
    // Return mock profiles
    return uids.map((uid) => ({
      uid,
      username: `user_${uid.slice(0, 6)}`,
      displayName: `User ${uid.slice(0, 6)}`,
      avatarUrl: '',
      isSearchable: true,
      blockedUsers: [],
      createdAt: { toMillis: () => Date.now() } as never,
      lastActive: { toMillis: () => Date.now() } as never,
    }))
  }

  try {
    const db = await getFirebaseDb()
    const { doc, getDoc } = await import('firebase/firestore')

    // Fetch each user profile
    const profiles: UserProfile[] = []
    for (const uid of uids) {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        profiles.push(userDoc.data() as UserProfile)
      }
    }

    return profiles
  } catch (error) {
    console.error('Error getting users:', error)
    return []
  }
}

/**
 * Search users by username (partial match)
 */
export const searchUsers = async (
  query: string,
  excludeUid?: string
): Promise<UserProfile[]> => {
  if (!query || query.length < 2) return []

  if (USE_MOCK_AUTH) {
    // Return mock search results
    return [
      {
        uid: 'mock-search-1',
        username: `${query}_user`,
        displayName: `${query} User`,
        avatarUrl: '',
        isSearchable: true,
        blockedUsers: [],
        createdAt: { toMillis: () => Date.now() } as never,
        lastActive: { toMillis: () => Date.now() } as never,
      },
    ]
  }

  try {
    const db = await getFirebaseDb()
    const { collection, query: firestoreQuery, where, getDocs, orderBy, limit } = await import('firebase/firestore')

    // Firestore doesn't support full-text search, so we use prefix matching
    // Search for usernames that start with the query
    const lowercaseQuery = query.toLowerCase()
    const q = firestoreQuery(
      collection(db, 'users'),
      where('isSearchable', '==', true),
      where('username', '>=', lowercaseQuery),
      where('username', '<=', lowercaseQuery + '\uf8ff'),
      orderBy('username'),
      limit(20)
    )

    const snapshot = await getDocs(q)
    const users: UserProfile[] = []

    snapshot.forEach((doc) => {
      const user = doc.data() as UserProfile
      // Exclude the searching user
      if (excludeUid && user.uid === excludeUid) return
      users.push(user)
    })

    return users
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}

/**
 * Get a single user by UID
 */
export const getUserById = async (uid: string): Promise<UserProfile | null> => {
  if (USE_MOCK_AUTH) {
    return {
      uid,
      username: `user_${uid.slice(0, 6)}`,
      displayName: `User ${uid.slice(0, 6)}`,
      avatarUrl: '',
      isSearchable: true,
      blockedUsers: [],
      createdAt: { toMillis: () => Date.now() } as never,
      lastActive: { toMillis: () => Date.now() } as never,
    }
  }

  try {
    const db = await getFirebaseDb()
    const { doc, getDoc } = await import('firebase/firestore')

    const userDoc = await getDoc(doc(db, 'users', uid))
    if (!userDoc.exists()) {
      return null
    }

    return userDoc.data() as UserProfile
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Get a user by username
 */
export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  if (USE_MOCK_AUTH) {
    return {
      uid: 'mock-uid',
      username,
      displayName: username,
      avatarUrl: '',
      isSearchable: true,
      blockedUsers: [],
      createdAt: { toMillis: () => Date.now() } as never,
      lastActive: { toMillis: () => Date.now() } as never,
    }
  }

  try {
    const db = await getFirebaseDb()
    const { collection, query, where, getDocs, limit } = await import('firebase/firestore')

    const q = query(
      collection(db, 'users'),
      where('username', '==', username.toLowerCase()),
      limit(1)
    )

    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return null
    }

    return snapshot.docs[0].data() as UserProfile
  } catch (error) {
    console.error('Error getting user by username:', error)
    return null
  }
}
