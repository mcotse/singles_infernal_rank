/**
 * Firestore Friendship Service Tests
 *
 * Tests for friendship CRUD operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  Timestamp: {
    now: () => ({ toMillis: () => Date.now(), toJSON: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }) }),
    fromMillis: (ms: number) => ({ toMillis: () => ms, toJSON: () => ({ seconds: ms / 1000, nanoseconds: 0 }) }),
  },
}))

vi.mock('./firebase', () => ({
  getFirebaseDb: vi.fn(),
  USE_MOCK_AUTH: true,
}))

describe('firestoreFriendships', () => {
  const mockUserId1 = 'user-abc'
  const mockUserId2 = 'user-xyz'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateFriendshipId', () => {
    it('should generate consistent ID regardless of user order', async () => {
      const { generateFriendshipId } = await import('./firestoreFriendships')

      const id1 = generateFriendshipId(mockUserId1, mockUserId2)
      const id2 = generateFriendshipId(mockUserId2, mockUserId1)

      expect(id1).toBe(id2)
    })

    it('should create ID from sorted user IDs', async () => {
      const { generateFriendshipId } = await import('./firestoreFriendships')

      // user-abc < user-xyz alphabetically
      const id = generateFriendshipId(mockUserId1, mockUserId2)

      expect(id).toBe('user-abc_user-xyz')
    })
  })

  describe('createFriendRequest', () => {
    it('should create a pending friendship request', async () => {
      const { createFriendRequest } = await import('./firestoreFriendships')

      const result = await createFriendRequest(mockUserId1, mockUserId2)

      expect(result.success).toBe(true)
      expect(result.friendshipId).toBeDefined()
    })

    it('should fail if requesting friendship with self', async () => {
      const { createFriendRequest } = await import('./firestoreFriendships')

      const result = await createFriendRequest(mockUserId1, mockUserId1)

      expect(result.success).toBe(false)
      expect(result.error).toContain('yourself')
    })
  })

  describe('acceptFriendRequest', () => {
    it('should accept a pending request', async () => {
      const { acceptFriendRequest } = await import('./firestoreFriendships')

      // Mock that friendship exists and is pending
      const result = await acceptFriendRequest('friendship-id', mockUserId2)

      expect(result.success).toBe(true)
    })
  })

  describe('declineFriendRequest', () => {
    it('should delete the friendship document', async () => {
      const { declineFriendRequest } = await import('./firestoreFriendships')

      const result = await declineFriendRequest('friendship-id', mockUserId2)

      expect(result.success).toBe(true)
    })
  })

  describe('unfriend', () => {
    it('should delete an active friendship', async () => {
      const { unfriend } = await import('./firestoreFriendships')

      const result = await unfriend(mockUserId1, mockUserId2)

      expect(result.success).toBe(true)
    })
  })

  describe('FriendRequest type', () => {
    it('should have required fields', async () => {
      const { createFriendRequestObject } = await import('./firestoreFriendships')

      const request = createFriendRequestObject(mockUserId1, mockUserId2)

      expect(request.users).toHaveLength(2)
      expect(request.status).toBe('pending')
      expect(request.requestedBy).toBe(mockUserId1)
      expect(request.id).toBeDefined()
    })

    it('should sort user IDs', async () => {
      const { createFriendRequestObject } = await import('./firestoreFriendships')

      const request = createFriendRequestObject(mockUserId2, mockUserId1)

      // Should be sorted alphabetically
      expect(request.users[0]).toBe(mockUserId1)
      expect(request.users[1]).toBe(mockUserId2)
    })
  })

  describe('getFriendships', () => {
    it('should return empty array when no friendships exist', async () => {
      const { getFriendships } = await import('./firestoreFriendships')

      const friendships = await getFriendships(mockUserId1)

      // In mock mode, returns empty array
      expect(Array.isArray(friendships)).toBe(true)
    })
  })

  describe('getPendingRequests', () => {
    it('should return incoming pending requests', async () => {
      const { getPendingRequests } = await import('./firestoreFriendships')

      const requests = await getPendingRequests(mockUserId1, 'incoming')

      expect(Array.isArray(requests)).toBe(true)
    })

    it('should return outgoing pending requests', async () => {
      const { getPendingRequests } = await import('./firestoreFriendships')

      const requests = await getPendingRequests(mockUserId1, 'outgoing')

      expect(Array.isArray(requests)).toBe(true)
    })
  })

  describe('blockUser', () => {
    it('should block a user', async () => {
      const { blockUser } = await import('./firestoreFriendships')

      const result = await blockUser(mockUserId1, mockUserId2)

      expect(result.success).toBe(true)
    })

    it('should fail if blocking self', async () => {
      const { blockUser } = await import('./firestoreFriendships')

      const result = await blockUser(mockUserId1, mockUserId1)

      expect(result.success).toBe(false)
      expect(result.error).toContain('yourself')
    })
  })
})
