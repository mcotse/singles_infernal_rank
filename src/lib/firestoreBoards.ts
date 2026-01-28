/**
 * Firestore Board Service
 *
 * Provides CRUD operations for boards in Firestore.
 * Handles conversion between local Board type and cloud CloudBoard type.
 *
 * Sync strategy:
 * - Offline-first: app works without network
 * - Conflict resolution: local always wins
 * - Boards are stored at /boards/{boardId} in Firestore
 */

import type { Board } from './types'
import type { BoardSharing } from './socialTypes'
import { createBoardSharing } from './socialTypes'
import { getFirebaseDb, USE_MOCK_AUTH } from './firebase'

/**
 * CloudBoard - Board with cloud sync metadata
 * Combines local Board fields with cloud-specific fields
 */
export interface CloudBoard extends Board {
  ownerId: string
  sharing: BoardSharing
  syncedAt: number // Last sync timestamp (ms)
  templateId?: string
}

/**
 * Convert a local Board to CloudBoard format for Firestore
 */
export const toCloudBoard = (
  board: Board,
  ownerId: string,
  options?: { sharing?: BoardSharing; templateId?: string }
): CloudBoard => {
  const cloudBoard: CloudBoard = {
    ...board,
    ownerId,
    sharing: options?.sharing ?? createBoardSharing(),
    syncedAt: Date.now(),
  }
  // Firestore rejects undefined values - only set templateId if defined
  const templateId = options?.templateId ?? board.templateId
  if (templateId) {
    cloudBoard.templateId = templateId
  } else {
    delete cloudBoard.templateId
  }
  return cloudBoard
}

/**
 * Convert a CloudBoard to local Board format
 * Strips cloud-only fields
 */
export const fromCloudBoard = (cloudBoard: CloudBoard): Board => ({
  id: cloudBoard.id,
  name: cloudBoard.name,
  coverImage: cloudBoard.coverImage,
  createdAt: cloudBoard.createdAt,
  updatedAt: cloudBoard.updatedAt,
  deletedAt: cloudBoard.deletedAt,
})

/**
 * Merge two boards, with local taking precedence
 * Per spec: "Conflict resolution: Local data takes precedence in sync conflicts"
 *
 * @param local - Local board (takes precedence)
 * @param cloud - Cloud board
 * @returns Merged board (local wins on all conflicts)
 */
export const mergeBoards = (
  local: Board | null,
  cloud: Board | null
): Board => {
  if (!local && !cloud) {
    throw new Error('Cannot merge: both boards are null')
  }

  // If only one exists, return it
  if (!local) return cloud!
  if (!cloud) return local

  // Local always wins per spec
  return local
}

/**
 * Merge two lists of boards by ID
 * - Boards only in local: kept as-is
 * - Boards only in cloud: added
 * - Boards in both: local wins
 *
 * @param localBoards - Local board list
 * @param cloudBoards - Cloud board list
 * @returns Merged board list
 */
export const mergeBoardLists = (
  localBoards: Board[],
  cloudBoards: Board[]
): Board[] => {
  // Create maps for fast lookup
  const localMap = new Map(localBoards.map((b) => [b.id, b]))
  const cloudMap = new Map(cloudBoards.map((b) => [b.id, b]))

  // Get all unique IDs
  const allIds = new Set([...localMap.keys(), ...cloudMap.keys()])

  // Merge each board
  const merged: Board[] = []
  for (const id of allIds) {
    const local = localMap.get(id) ?? null
    const cloud = cloudMap.get(id) ?? null
    merged.push(mergeBoards(local, cloud))
  }

  return merged
}

// ============ Firestore CRUD Operations ============

/**
 * Save a board to Firestore
 */
export const saveCloudBoard = async (
  board: Board,
  ownerId: string
): Promise<CloudBoard> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, just return the cloud board without saving
    return toCloudBoard(board, ownerId)
  }

  const db = await getFirebaseDb()
  const { doc, setDoc } = await import('firebase/firestore')

  const cloudBoard = toCloudBoard(board, ownerId)
  await setDoc(doc(db, 'boards', board.id), cloudBoard)

  return cloudBoard
}

/**
 * Get a board from Firestore
 */
export const getCloudBoard = async (
  boardId: string
): Promise<CloudBoard | null> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, return null (no cloud data)
    return null
  }

  const db = await getFirebaseDb()
  const { doc, getDoc } = await import('firebase/firestore')

  const docSnap = await getDoc(doc(db, 'boards', boardId))
  if (!docSnap.exists()) {
    return null
  }

  return docSnap.data() as CloudBoard
}

/**
 * Get all boards for a user from Firestore
 */
export const getCloudBoardsByOwner = async (
  ownerId: string
): Promise<CloudBoard[]> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, return empty array (no cloud data)
    return []
  }

  const db = await getFirebaseDb()
  const { collection, query, where, getDocs } = await import('firebase/firestore')

  const q = query(collection(db, 'boards'), where('ownerId', '==', ownerId))
  const snapshot = await getDocs(q)

  const boards: CloudBoard[] = []
  snapshot.forEach((doc) => {
    boards.push(doc.data() as CloudBoard)
  })

  return boards
}

/**
 * Delete a board from Firestore
 */
export const deleteCloudBoard = async (boardId: string): Promise<void> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, do nothing
    return
  }

  const db = await getFirebaseDb()
  const { doc, deleteDoc } = await import('firebase/firestore')

  await deleteDoc(doc(db, 'boards', boardId))
}

/**
 * Sync multiple boards to Firestore
 * Uploads all provided boards for the given owner
 */
export const syncBoardsToCloud = async (
  boards: Board[],
  ownerId: string
): Promise<CloudBoard[]> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, just return cloud boards without saving
    return boards.map((b) => toCloudBoard(b, ownerId))
  }

  const db = await getFirebaseDb()
  const { doc, writeBatch } = await import('firebase/firestore')

  // Use batch write for efficiency
  const batch = writeBatch(db)
  const cloudBoards: CloudBoard[] = []

  for (const board of boards) {
    const cloudBoard = toCloudBoard(board, ownerId)
    batch.set(doc(db, 'boards', board.id), cloudBoard)
    cloudBoards.push(cloudBoard)
  }

  await batch.commit()

  return cloudBoards
}

/**
 * Full sync: download cloud boards, merge with local, upload results
 * Per spec: local always wins conflicts
 *
 * @param localBoards - Current local boards
 * @param ownerId - User's Firebase UID
 * @returns Merged board list
 */
export const fullBoardSync = async (
  localBoards: Board[],
  ownerId: string
): Promise<Board[]> => {
  // Get cloud boards
  const cloudBoards = await getCloudBoardsByOwner(ownerId)

  // Convert cloud boards to local format
  const cloudAsLocal = cloudBoards.map(fromCloudBoard)

  // Merge (local wins)
  const merged = mergeBoardLists(localBoards, cloudAsLocal)

  // Upload merged result to cloud
  await syncBoardsToCloud(merged, ownerId)

  return merged
}

// ============ Public Link Management ============

/**
 * Generate a unique, URL-safe public link ID
 * Uses crypto for randomness and encodes as alphanumeric
 */
export const generatePublicLinkId = (): string => {
  // Use crypto for secure random bytes
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)

  // Convert to alphanumeric base64 (URL-safe)
  const base64 = btoa(String.fromCharCode(...bytes))

  // Remove non-alphanumeric chars and return
  return base64.replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Update sharing settings for a cloud board
 *
 * @param board - The cloud board to update
 * @param updates - Partial sharing settings to apply
 * @returns Updated cloud board
 */
export const updateBoardSharing = (
  board: CloudBoard,
  updates: Partial<BoardSharing>
): CloudBoard => {
  const newSharing: BoardSharing = {
    ...board.sharing,
    ...updates,
  }

  // If enabling public link and no ID exists, generate one
  if (updates.publicLinkEnabled && !board.sharing.publicLinkId) {
    newSharing.publicLinkId = generatePublicLinkId()
  }

  return {
    ...board,
    sharing: newSharing,
  }
}

/**
 * Revoke the current public link and generate a new one
 * Invalidates any existing links while keeping sharing enabled
 *
 * @param board - The cloud board with public link
 * @returns Board with new publicLinkId
 */
export const revokePublicLink = (board: CloudBoard): CloudBoard => {
  if (!board.sharing.publicLinkEnabled) {
    return board
  }

  return {
    ...board,
    sharing: {
      ...board.sharing,
      publicLinkId: generatePublicLinkId(),
    },
  }
}

// ============ Access Control ============

/**
 * Check if a user can view a board based on visibility settings
 *
 * @param board - The cloud board to check
 * @param userId - The user trying to view
 * @param userFriendIds - IDs of the user's friends (owner UIDs)
 * @returns true if user can view the board
 */
export const canUserViewBoard = (
  board: CloudBoard,
  userId: string,
  userFriendIds: string[]
): boolean => {
  // Owner can always view
  if (board.ownerId === userId) {
    return true
  }

  switch (board.sharing.visibility) {
    case 'private':
      return false

    case 'public':
      return true

    case 'friends':
      // User must be friends with the board owner
      return userFriendIds.includes(board.ownerId)

    case 'specific':
      // User must be in the allowed list
      return board.sharing.allowedFriends?.includes(userId) ?? false

    default:
      return false
  }
}

/**
 * Filter a list of boards to only those viewable by the user
 *
 * @param boards - List of cloud boards to filter
 * @param userId - The user trying to view
 * @param userFriendIds - IDs of the user's friends (owner UIDs)
 * @returns Boards the user can view
 */
export const filterVisibleBoards = (
  boards: CloudBoard[],
  userId: string,
  userFriendIds: string[]
): CloudBoard[] => {
  return boards.filter((board) => canUserViewBoard(board, userId, userFriendIds))
}

/**
 * Get count of boards shared by a friend that the user can view
 *
 * @param allBoards - All boards to search through
 * @param friendId - The friend's user ID (board owner)
 * @param userId - The viewing user's ID
 * @param userFriendIds - IDs of all the user's friends
 * @returns Number of viewable boards from this friend
 */
export const getSharedBoardCountByFriend = (
  allBoards: CloudBoard[],
  friendId: string,
  userId: string,
  userFriendIds: string[]
): number => {
  return allBoards.filter((board) => {
    // Must be owned by the friend
    if (board.ownerId !== friendId) {
      return false
    }
    // Must be viewable by the user (not private)
    return canUserViewBoard(board, userId, userFriendIds)
  }).length
}
