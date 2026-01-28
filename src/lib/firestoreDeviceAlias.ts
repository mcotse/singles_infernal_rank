/**
 * Firestore Device Alias Service
 *
 * Persists device token → alias mappings in Firestore.
 * In mock mode, falls back to localStorage.
 */

import { getFirebaseDb, USE_MOCK_AUTH } from './firebase'
import { generateDeviceAlias } from './deviceAlias'

const MOCK_ALIAS_KEY = 'singles-infernal-rank:device-alias'

/**
 * Get the alias for a device token, creating it if it doesn't exist.
 *
 * - In mock mode: uses localStorage
 * - In production: reads/writes Firestore `deviceAliases/{deviceToken}`
 */
export const getOrCreateDeviceAlias = async (deviceToken: string): Promise<string> => {
  if (USE_MOCK_AUTH) {
    const existing = localStorage.getItem(MOCK_ALIAS_KEY)
    if (existing) return existing

    const alias = generateDeviceAlias(deviceToken)
    localStorage.setItem(MOCK_ALIAS_KEY, alias)
    return alias
  }

  const db = await getFirebaseDb()
  const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore')

  const docRef = doc(db, 'deviceAliases', deviceToken)
  const snapshot = await getDoc(docRef)

  if (snapshot.exists()) {
    return snapshot.data().alias as string
  }

  const alias = generateDeviceAlias(deviceToken)
  await setDoc(docRef, {
    alias,
    createdAt: serverTimestamp(),
  })

  return alias
}
