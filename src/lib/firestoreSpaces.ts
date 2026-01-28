/**
 * Firestore Spaces Service
 *
 * CRUD operations for spaces, members, and boards in Firestore.
 * Collection structure: spaces/{spaceId}/members/{memberId}, spaces/{spaceId}/boards/{boardId}
 */

import type { Board } from './types'
import type { Space, SpaceMember, SpaceBoard, SpaceMemberRole } from './spaceTypes'
import { getFirebaseDb, USE_MOCK_AUTH } from './firebase'

// ============ Space CRUD ============

/**
 * Create a new space in Firestore
 */
export const createFirestoreSpace = async (
  spaceId: string,
  name: string,
  joinCode: string,
  createdBy: string
): Promise<void> => {
  if (USE_MOCK_AUTH) return

  const db = await getFirebaseDb()
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

  await setDoc(doc(db, 'spaces', spaceId), {
    name,
    joinCode,
    createdBy,
    createdAt: serverTimestamp(),
    memberCount: 0,
  })
}

/**
 * Get a space by ID
 */
export const getFirestoreSpace = async (spaceId: string): Promise<Space | null> => {
  if (USE_MOCK_AUTH) return null

  const db = await getFirebaseDb()
  const { doc, getDoc } = await import('firebase/firestore')

  const snap = await getDoc(doc(db, 'spaces', spaceId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Space
}

/**
 * Find a space by join code
 */
export const findSpaceByJoinCode = async (joinCode: string): Promise<Space | null> => {
  if (USE_MOCK_AUTH) return null

  const db = await getFirebaseDb()
  const { collection, query, where, getDocs, limit } = await import('firebase/firestore')

  const q = query(
    collection(db, 'spaces'),
    where('joinCode', '==', joinCode.toLowerCase().trim()),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null

  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() } as Space
}

/**
 * Get all existing join codes (for uniqueness checks)
 */
export const getAllJoinCodes = async (): Promise<Set<string>> => {
  if (USE_MOCK_AUTH) return new Set()

  const db = await getFirebaseDb()
  const { collection, getDocs } = await import('firebase/firestore')

  const snap = await getDocs(collection(db, 'spaces'))
  const codes = new Set<string>()
  snap.forEach((doc) => {
    const data = doc.data()
    if (data.joinCode) codes.add(data.joinCode)
  })
  return codes
}

// ============ Member CRUD ============

/**
 * Add a member to a space
 */
export const addSpaceMember = async (
  spaceId: string,
  memberId: string,
  displayName: string,
  deviceToken: string,
  anonUid: string,
  role: SpaceMemberRole = 'member'
): Promise<void> => {
  if (USE_MOCK_AUTH) return

  const db = await getFirebaseDb()
  const { doc, setDoc, serverTimestamp, increment, updateDoc } = await import('firebase/firestore')

  await setDoc(doc(db, 'spaces', spaceId, 'members', memberId), {
    displayName,
    deviceToken,
    role,
    joinedAt: serverTimestamp(),
    anonUid,
  })

  // Increment member count
  await updateDoc(doc(db, 'spaces', spaceId), {
    memberCount: increment(1),
  })
}

/**
 * Get all members of a space
 */
export const getSpaceMembers = async (spaceId: string): Promise<SpaceMember[]> => {
  if (USE_MOCK_AUTH) return []

  const db = await getFirebaseDb()
  const { collection, getDocs } = await import('firebase/firestore')

  const snap = await getDocs(collection(db, 'spaces', spaceId, 'members'))
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as SpaceMember)
}

/**
 * Get a specific member
 */
export const getSpaceMember = async (
  spaceId: string,
  memberId: string
): Promise<SpaceMember | null> => {
  if (USE_MOCK_AUTH) return null

  const db = await getFirebaseDb()
  const { doc, getDoc } = await import('firebase/firestore')

  const snap = await getDoc(doc(db, 'spaces', spaceId, 'members', memberId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as SpaceMember
}

/**
 * Find a member by device token in a space
 */
export const findMemberByDeviceToken = async (
  spaceId: string,
  deviceToken: string
): Promise<SpaceMember | null> => {
  if (USE_MOCK_AUTH) return null

  const db = await getFirebaseDb()
  const { collection, query, where, getDocs, limit } = await import('firebase/firestore')

  const q = query(
    collection(db, 'spaces', spaceId, 'members'),
    where('deviceToken', '==', deviceToken),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null

  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() } as SpaceMember
}

/**
 * Remove a member from a space (admin action)
 */
export const removeSpaceMember = async (
  spaceId: string,
  memberId: string
): Promise<void> => {
  if (USE_MOCK_AUTH) return

  const db = await getFirebaseDb()
  const { doc, deleteDoc, increment, updateDoc } = await import('firebase/firestore')

  await deleteDoc(doc(db, 'spaces', spaceId, 'members', memberId))

  // Decrement member count
  await updateDoc(doc(db, 'spaces', spaceId), {
    memberCount: increment(-1),
  })
}

// ============ Board CRUD ============

/**
 * Save a board to a space
 */
export const saveSpaceBoard = async (
  spaceId: string,
  board: Board,
  ownerId: string,
  ownerName: string,
  isDraft: boolean = false
): Promise<SpaceBoard> => {
  const spaceBoard: SpaceBoard = {
    ...board,
    spaceId,
    ownerId,
    ownerName,
    isDraft,
    syncedAt: Date.now(),
  }

  if (USE_MOCK_AUTH) return spaceBoard

  const db = await getFirebaseDb()
  const { doc, setDoc } = await import('firebase/firestore')

  await setDoc(doc(db, 'spaces', spaceId, 'boards', board.id), spaceBoard)
  return spaceBoard
}

/**
 * Get all boards in a space
 */
export const getSpaceBoards = async (spaceId: string): Promise<SpaceBoard[]> => {
  if (USE_MOCK_AUTH) return []

  const db = await getFirebaseDb()
  const { collection, getDocs } = await import('firebase/firestore')

  const snap = await getDocs(collection(db, 'spaces', spaceId, 'boards'))
  return snap.docs.map((doc) => doc.data() as SpaceBoard)
}

/**
 * Get boards by owner in a space
 */
export const getSpaceBoardsByOwner = async (
  spaceId: string,
  ownerId: string
): Promise<SpaceBoard[]> => {
  if (USE_MOCK_AUTH) return []

  const db = await getFirebaseDb()
  const { collection, query, where, getDocs } = await import('firebase/firestore')

  const q = query(
    collection(db, 'spaces', spaceId, 'boards'),
    where('ownerId', '==', ownerId)
  )
  const snap = await getDocs(q)
  return snap.docs.map((doc) => doc.data() as SpaceBoard)
}

/**
 * Delete a board from a space
 */
export const deleteSpaceBoard = async (
  spaceId: string,
  boardId: string
): Promise<void> => {
  if (USE_MOCK_AUTH) return

  const db = await getFirebaseDb()
  const { doc, deleteDoc } = await import('firebase/firestore')

  await deleteDoc(doc(db, 'spaces', spaceId, 'boards', boardId))
}

/**
 * Update draft status of a board
 */
export const updateSpaceBoardDraft = async (
  spaceId: string,
  boardId: string,
  isDraft: boolean
): Promise<void> => {
  if (USE_MOCK_AUTH) return

  const db = await getFirebaseDb()
  const { doc, updateDoc } = await import('firebase/firestore')

  await updateDoc(doc(db, 'spaces', spaceId, 'boards', boardId), {
    isDraft,
    syncedAt: Date.now(),
  })
}
