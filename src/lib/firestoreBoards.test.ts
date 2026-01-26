/**
 * Firestore Board Service Tests
 *
 * Tests for cloud board CRUD operations.
 * Uses mock Firestore to test without Firebase.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Board } from './types'

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(),
  })),
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() }),
    fromMillis: (ms: number) => ({ toMillis: () => ms }),
  },
}))

vi.mock('./firebase', () => ({
  getFirebaseDb: vi.fn(),
  USE_MOCK_AUTH: true,
}))

describe('firestoreBoards', () => {
  const mockBoard: Board = {
    id: 'board-123',
    name: 'Test Board',
    coverImage: null,
    createdAt: Date.now() - 10000,
    updatedAt: Date.now(),
    deletedAt: null,
  }

  const mockUserId = 'user-abc'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('toCloudBoard', () => {
    it('should convert local board to cloud format with owner info', async () => {
      const { toCloudBoard } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)

      expect(cloudBoard.id).toBe(mockBoard.id)
      expect(cloudBoard.name).toBe(mockBoard.name)
      expect(cloudBoard.ownerId).toBe(mockUserId)
      expect(cloudBoard.sharing.visibility).toBe('private')
      expect(cloudBoard.sharing.publicLinkEnabled).toBe(false)
    })

    it('should preserve all local board fields', async () => {
      const { toCloudBoard } = await import('./firestoreBoards')

      const boardWithCover: Board = {
        ...mockBoard,
        coverImage: 'cover-key-123',
      }

      const cloudBoard = toCloudBoard(boardWithCover, mockUserId)

      expect(cloudBoard.coverImage).toBe('cover-key-123')
      expect(cloudBoard.createdAt).toBe(boardWithCover.createdAt)
      expect(cloudBoard.updatedAt).toBe(boardWithCover.updatedAt)
    })

    it('should set default sharing settings', async () => {
      const { toCloudBoard } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)

      expect(cloudBoard.sharing).toEqual({
        visibility: 'private',
        publicLinkEnabled: false,
      })
    })
  })

  describe('fromCloudBoard', () => {
    it('should convert cloud board to local format', async () => {
      const { toCloudBoard, fromCloudBoard } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)
      const localBoard = fromCloudBoard(cloudBoard)

      expect(localBoard.id).toBe(mockBoard.id)
      expect(localBoard.name).toBe(mockBoard.name)
      expect(localBoard.coverImage).toBe(mockBoard.coverImage)
      expect(localBoard.createdAt).toBe(mockBoard.createdAt)
      expect(localBoard.updatedAt).toBe(mockBoard.updatedAt)
      expect(localBoard.deletedAt).toBe(mockBoard.deletedAt)
    })

    it('should strip cloud-only fields', async () => {
      const { toCloudBoard, fromCloudBoard } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)
      const localBoard = fromCloudBoard(cloudBoard) as unknown as Record<string, unknown>

      expect(localBoard.ownerId).toBeUndefined()
      expect(localBoard.sharing).toBeUndefined()
      expect(localBoard.syncedAt).toBeUndefined()
    })
  })

  describe('CloudBoard type', () => {
    it('should extend Board with cloud fields', async () => {
      const { toCloudBoard } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)

      // Required cloud fields
      expect(cloudBoard).toHaveProperty('ownerId')
      expect(cloudBoard).toHaveProperty('sharing')
      expect(cloudBoard).toHaveProperty('syncedAt')

      // Original board fields
      expect(cloudBoard).toHaveProperty('id')
      expect(cloudBoard).toHaveProperty('name')
      expect(cloudBoard).toHaveProperty('coverImage')
      expect(cloudBoard).toHaveProperty('createdAt')
      expect(cloudBoard).toHaveProperty('updatedAt')
      expect(cloudBoard).toHaveProperty('deletedAt')
    })
  })

  describe('mergeBoards', () => {
    it('should prefer local board when timestamps differ (local wins)', async () => {
      const { mergeBoards } = await import('./firestoreBoards')

      const localBoard: Board = {
        ...mockBoard,
        name: 'Local Name',
        updatedAt: Date.now(),
      }

      const cloudBoard: Board = {
        ...mockBoard,
        name: 'Cloud Name',
        updatedAt: Date.now() - 5000, // older
      }

      const merged = mergeBoards(localBoard, cloudBoard)

      expect(merged.name).toBe('Local Name')
    })

    it('should prefer local board even when cloud is newer (local always wins)', async () => {
      const { mergeBoards } = await import('./firestoreBoards')

      const localBoard: Board = {
        ...mockBoard,
        name: 'Local Name',
        updatedAt: Date.now() - 5000, // older
      }

      const cloudBoard: Board = {
        ...mockBoard,
        name: 'Cloud Name',
        updatedAt: Date.now(), // newer
      }

      // Per spec: local always wins
      const merged = mergeBoards(localBoard, cloudBoard)
      expect(merged.name).toBe('Local Name')
    })

    it('should return local board if cloud is null', async () => {
      const { mergeBoards } = await import('./firestoreBoards')

      const localBoard: Board = { ...mockBoard, name: 'Local Only' }

      const merged = mergeBoards(localBoard, null)

      expect(merged.name).toBe('Local Only')
    })

    it('should return cloud board if local is null', async () => {
      const { mergeBoards } = await import('./firestoreBoards')

      const cloudBoard: Board = { ...mockBoard, name: 'Cloud Only' }

      const merged = mergeBoards(null, cloudBoard)

      expect(merged.name).toBe('Cloud Only')
    })
  })

  describe('mergeBoardLists', () => {
    it('should combine local and cloud boards by ID', async () => {
      const { mergeBoardLists } = await import('./firestoreBoards')

      const localBoards: Board[] = [
        { ...mockBoard, id: 'board-1', name: 'Local Board 1' },
        { ...mockBoard, id: 'board-2', name: 'Local Board 2' },
      ]

      const cloudBoards: Board[] = [
        { ...mockBoard, id: 'board-2', name: 'Cloud Board 2' },
        { ...mockBoard, id: 'board-3', name: 'Cloud Board 3' },
      ]

      const merged = mergeBoardLists(localBoards, cloudBoards)

      expect(merged).toHaveLength(3)
      expect(merged.find((b) => b.id === 'board-1')?.name).toBe('Local Board 1')
      expect(merged.find((b) => b.id === 'board-2')?.name).toBe('Local Board 2') // local wins
      expect(merged.find((b) => b.id === 'board-3')?.name).toBe('Cloud Board 3')
    })

    it('should handle empty local list', async () => {
      const { mergeBoardLists } = await import('./firestoreBoards')

      const cloudBoards: Board[] = [
        { ...mockBoard, id: 'board-1', name: 'Cloud Board 1' },
      ]

      const merged = mergeBoardLists([], cloudBoards)

      expect(merged).toHaveLength(1)
      expect(merged[0].name).toBe('Cloud Board 1')
    })

    it('should handle empty cloud list', async () => {
      const { mergeBoardLists } = await import('./firestoreBoards')

      const localBoards: Board[] = [
        { ...mockBoard, id: 'board-1', name: 'Local Board 1' },
      ]

      const merged = mergeBoardLists(localBoards, [])

      expect(merged).toHaveLength(1)
      expect(merged[0].name).toBe('Local Board 1')
    })
  })

  describe('generatePublicLinkId', () => {
    it('should generate a unique string ID', async () => {
      const { generatePublicLinkId } = await import('./firestoreBoards')

      const id1 = generatePublicLinkId()
      const id2 = generatePublicLinkId()

      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
      expect(id1).not.toBe(id2) // Should be unique
    })

    it('should generate URL-safe IDs', async () => {
      const { generatePublicLinkId } = await import('./firestoreBoards')

      const id = generatePublicLinkId()

      // Should only contain alphanumeric characters
      expect(id).toMatch(/^[a-zA-Z0-9]+$/)
    })
  })

  describe('updateBoardSharing', () => {
    it('should update board sharing settings', async () => {
      const { toCloudBoard, updateBoardSharing } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)

      const updatedBoard = updateBoardSharing(cloudBoard, {
        visibility: 'friends',
      })

      expect(updatedBoard.sharing.visibility).toBe('friends')
      expect(updatedBoard.sharing.publicLinkEnabled).toBe(false) // unchanged
    })

    it('should enable public link with generated ID', async () => {
      const { toCloudBoard, updateBoardSharing } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)

      const updatedBoard = updateBoardSharing(cloudBoard, {
        visibility: 'public',
        publicLinkEnabled: true,
      })

      expect(updatedBoard.sharing.visibility).toBe('public')
      expect(updatedBoard.sharing.publicLinkEnabled).toBe(true)
      expect(updatedBoard.sharing.publicLinkId).toBeDefined()
      expect(updatedBoard.sharing.publicLinkId!.length).toBeGreaterThan(0)
    })

    it('should preserve existing publicLinkId when already set', async () => {
      const { toCloudBoard, updateBoardSharing } = await import('./firestoreBoards')

      let cloudBoard = toCloudBoard(mockBoard, mockUserId)
      cloudBoard = updateBoardSharing(cloudBoard, {
        visibility: 'public',
        publicLinkEnabled: true,
      })
      const originalLinkId = cloudBoard.sharing.publicLinkId

      // Update other settings but keep public link enabled
      const updatedBoard = updateBoardSharing(cloudBoard, {
        visibility: 'public',
        publicLinkEnabled: true,
      })

      expect(updatedBoard.sharing.publicLinkId).toBe(originalLinkId)
    })

    it('should set allowedFriends for specific visibility', async () => {
      const { toCloudBoard, updateBoardSharing } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)
      const friendIds = ['friend-1', 'friend-2']

      const updatedBoard = updateBoardSharing(cloudBoard, {
        visibility: 'specific',
        allowedFriends: friendIds,
      })

      expect(updatedBoard.sharing.visibility).toBe('specific')
      expect(updatedBoard.sharing.allowedFriends).toEqual(friendIds)
    })
  })

  describe('revokePublicLink', () => {
    it('should generate new publicLinkId', async () => {
      const { toCloudBoard, updateBoardSharing, revokePublicLink } = await import('./firestoreBoards')

      let cloudBoard = toCloudBoard(mockBoard, mockUserId)
      cloudBoard = updateBoardSharing(cloudBoard, {
        visibility: 'public',
        publicLinkEnabled: true,
      })
      const originalLinkId = cloudBoard.sharing.publicLinkId

      const revokedBoard = revokePublicLink(cloudBoard)

      expect(revokedBoard.sharing.publicLinkId).toBeDefined()
      expect(revokedBoard.sharing.publicLinkId).not.toBe(originalLinkId)
      expect(revokedBoard.sharing.publicLinkEnabled).toBe(true) // Still enabled
    })

    it('should do nothing if publicLinkEnabled is false', async () => {
      const { toCloudBoard, revokePublicLink } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)

      const revokedBoard = revokePublicLink(cloudBoard)

      expect(revokedBoard.sharing.publicLinkId).toBeUndefined()
      expect(revokedBoard.sharing.publicLinkEnabled).toBe(false)
    })
  })

  describe('canUserViewBoard', () => {
    it('should return true for board owner', async () => {
      const { toCloudBoard, canUserViewBoard } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, mockUserId)

      expect(canUserViewBoard(cloudBoard, mockUserId, [])).toBe(true)
    })

    it('should return false for private board not owned by user', async () => {
      const { toCloudBoard, canUserViewBoard } = await import('./firestoreBoards')

      const cloudBoard = toCloudBoard(mockBoard, 'other-owner')

      expect(canUserViewBoard(cloudBoard, mockUserId, [])).toBe(false)
    })

    it('should return true for public board', async () => {
      const { toCloudBoard, updateBoardSharing, canUserViewBoard } = await import('./firestoreBoards')

      let cloudBoard = toCloudBoard(mockBoard, 'other-owner')
      cloudBoard = updateBoardSharing(cloudBoard, { visibility: 'public' })

      expect(canUserViewBoard(cloudBoard, mockUserId, [])).toBe(true)
    })

    it('should return true for friends visibility when user is a friend', async () => {
      const { toCloudBoard, updateBoardSharing, canUserViewBoard } = await import('./firestoreBoards')

      const ownerId = 'other-owner'
      let cloudBoard = toCloudBoard(mockBoard, ownerId)
      cloudBoard = updateBoardSharing(cloudBoard, { visibility: 'friends' })

      // User is friends with the owner
      const friendIds = [ownerId]

      expect(canUserViewBoard(cloudBoard, mockUserId, friendIds)).toBe(true)
    })

    it('should return false for friends visibility when user is not a friend', async () => {
      const { toCloudBoard, updateBoardSharing, canUserViewBoard } = await import('./firestoreBoards')

      let cloudBoard = toCloudBoard(mockBoard, 'other-owner')
      cloudBoard = updateBoardSharing(cloudBoard, { visibility: 'friends' })

      // User has no friends
      expect(canUserViewBoard(cloudBoard, mockUserId, [])).toBe(false)
    })

    it('should return true for specific visibility when user is in allowedFriends', async () => {
      const { toCloudBoard, updateBoardSharing, canUserViewBoard } = await import('./firestoreBoards')

      let cloudBoard = toCloudBoard(mockBoard, 'other-owner')
      cloudBoard = updateBoardSharing(cloudBoard, {
        visibility: 'specific',
        allowedFriends: [mockUserId, 'friend-2'],
      })

      expect(canUserViewBoard(cloudBoard, mockUserId, [])).toBe(true)
    })

    it('should return false for specific visibility when user is not in allowedFriends', async () => {
      const { toCloudBoard, updateBoardSharing, canUserViewBoard } = await import('./firestoreBoards')

      let cloudBoard = toCloudBoard(mockBoard, 'other-owner')
      cloudBoard = updateBoardSharing(cloudBoard, {
        visibility: 'specific',
        allowedFriends: ['friend-1', 'friend-2'],
      })

      expect(canUserViewBoard(cloudBoard, mockUserId, [])).toBe(false)
    })
  })

  describe('filterVisibleBoards', () => {
    it('should filter boards to only those viewable by user', async () => {
      const { toCloudBoard, updateBoardSharing, filterVisibleBoards } = await import('./firestoreBoards')

      const privateBoard = toCloudBoard({ ...mockBoard, id: 'private' }, 'friend-1')
      const friendsBoard = updateBoardSharing(
        toCloudBoard({ ...mockBoard, id: 'friends' }, 'friend-1'),
        { visibility: 'friends' }
      )
      const publicBoard = updateBoardSharing(
        toCloudBoard({ ...mockBoard, id: 'public' }, 'friend-1'),
        { visibility: 'public' }
      )

      const boards = [privateBoard, friendsBoard, publicBoard]

      // User is friends with friend-1
      const visible = filterVisibleBoards(boards, mockUserId, ['friend-1'])

      // Should see friends and public boards, not private
      expect(visible).toHaveLength(2)
      expect(visible.map(b => b.id)).toContain('friends')
      expect(visible.map(b => b.id)).toContain('public')
      expect(visible.map(b => b.id)).not.toContain('private')
    })

    it('should include boards owned by user', async () => {
      const { toCloudBoard, filterVisibleBoards } = await import('./firestoreBoards')

      const ownBoard = toCloudBoard({ ...mockBoard, id: 'own' }, mockUserId)
      const otherBoard = toCloudBoard({ ...mockBoard, id: 'other' }, 'someone-else')

      const boards = [ownBoard, otherBoard]
      const visible = filterVisibleBoards(boards, mockUserId, [])

      // Should only see own board
      expect(visible).toHaveLength(1)
      expect(visible[0].id).toBe('own')
    })
  })

  describe('getSharedBoardCountByFriend', () => {
    it('should count boards shared by a friend that user can view', async () => {
      const { toCloudBoard, updateBoardSharing, getSharedBoardCountByFriend } = await import('./firestoreBoards')

      const friendUid = 'friend-1'
      const friendsBoard1 = updateBoardSharing(
        toCloudBoard({ ...mockBoard, id: 'board-1' }, friendUid),
        { visibility: 'friends' }
      )
      const friendsBoard2 = updateBoardSharing(
        toCloudBoard({ ...mockBoard, id: 'board-2' }, friendUid),
        { visibility: 'friends' }
      )
      const privateBoard = toCloudBoard({ ...mockBoard, id: 'private' }, friendUid)

      const allBoards = [friendsBoard1, friendsBoard2, privateBoard]

      const count = getSharedBoardCountByFriend(allBoards, friendUid, mockUserId, [friendUid])

      expect(count).toBe(2)
    })

    it('should return 0 when friend has no shared boards', async () => {
      const { toCloudBoard, getSharedBoardCountByFriend } = await import('./firestoreBoards')

      const privateBoard = toCloudBoard({ ...mockBoard, id: 'private' }, 'friend-1')
      const allBoards = [privateBoard]

      const count = getSharedBoardCountByFriend(allBoards, 'friend-1', mockUserId, ['friend-1'])

      expect(count).toBe(0)
    })
  })
})
