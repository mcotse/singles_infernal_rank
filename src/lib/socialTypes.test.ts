import { describe, it, expect } from 'vitest'
import {
  isUserProfile,
  isFriendship,
  isBoardSharing,
  isTemplateItem,
  isBoardTemplate,
  isNotification,
  sortUserIds,
  generateFriendshipId,
  createUserProfile,
  createBoardSharing,
} from './socialTypes'

describe('socialTypes', () => {
  describe('isUserProfile', () => {
    it('returns true for valid user profile', () => {
      const profile = {
        uid: 'user123',
        username: 'johndoe',
        displayName: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        isSearchable: true,
        blockedUsers: [],
        createdAt: { seconds: 1234567890, nanoseconds: 0 },
        lastActive: { seconds: 1234567890, nanoseconds: 0 },
      }
      expect(isUserProfile(profile)).toBe(true)
    })

    it('returns false for missing required fields', () => {
      expect(isUserProfile({ uid: 'user123' })).toBe(false)
      expect(isUserProfile(null)).toBe(false)
      expect(isUserProfile(undefined)).toBe(false)
      expect(isUserProfile('string')).toBe(false)
    })

    it('returns false for wrong types', () => {
      const invalid = {
        uid: 123, // should be string
        username: 'johndoe',
        displayName: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        isSearchable: true,
        blockedUsers: [],
      }
      expect(isUserProfile(invalid)).toBe(false)
    })
  })

  describe('isFriendship', () => {
    it('returns true for valid friendship', () => {
      const friendship = {
        id: 'friend123',
        users: ['user1', 'user2'],
        status: 'active',
        requestedBy: 'user1',
        createdAt: { seconds: 1234567890, nanoseconds: 0 },
      }
      expect(isFriendship(friendship)).toBe(true)
    })

    it('returns true for pending friendship', () => {
      const friendship = {
        id: 'friend123',
        users: ['user1', 'user2'],
        status: 'pending',
        requestedBy: 'user1',
        createdAt: { seconds: 1234567890, nanoseconds: 0 },
      }
      expect(isFriendship(friendship)).toBe(true)
    })

    it('returns false for invalid status', () => {
      const friendship = {
        id: 'friend123',
        users: ['user1', 'user2'],
        status: 'invalid',
        requestedBy: 'user1',
      }
      expect(isFriendship(friendship)).toBe(false)
    })

    it('returns false for wrong users array length', () => {
      const friendship = {
        id: 'friend123',
        users: ['user1'],
        status: 'active',
        requestedBy: 'user1',
      }
      expect(isFriendship(friendship)).toBe(false)
    })
  })

  describe('isBoardSharing', () => {
    it('returns true for valid private sharing', () => {
      expect(isBoardSharing({ visibility: 'private', publicLinkEnabled: false })).toBe(true)
    })

    it('returns true for valid friends sharing', () => {
      expect(isBoardSharing({ visibility: 'friends', publicLinkEnabled: false })).toBe(true)
    })

    it('returns true for valid specific sharing', () => {
      expect(
        isBoardSharing({
          visibility: 'specific',
          allowedFriends: ['user1', 'user2'],
          publicLinkEnabled: false,
        })
      ).toBe(true)
    })

    it('returns true for valid public sharing', () => {
      expect(
        isBoardSharing({
          visibility: 'public',
          publicLinkEnabled: true,
          publicLinkId: 'abc123',
        })
      ).toBe(true)
    })

    it('returns false for invalid visibility', () => {
      expect(isBoardSharing({ visibility: 'invalid', publicLinkEnabled: false })).toBe(false)
    })
  })

  describe('isTemplateItem', () => {
    it('returns true for valid template item', () => {
      expect(isTemplateItem({ id: 'item1', name: 'Test Item' })).toBe(true)
    })

    it('returns true for template item with optional fields', () => {
      expect(
        isTemplateItem({
          id: 'item1',
          name: 'Test Item',
          defaultImageUrl: 'https://example.com/image.jpg',
        })
      ).toBe(true)
    })

    it('returns false for missing required fields', () => {
      expect(isTemplateItem({ id: 'item1' })).toBe(false)
      expect(isTemplateItem({ name: 'Test' })).toBe(false)
    })
  })

  describe('isBoardTemplate', () => {
    it('returns true for valid board template', () => {
      const template = {
        id: 'template1',
        name: 'Singles Inferno S5',
        description: 'Rank the contestants',
        category: 'Reality TV',
        items: [{ id: 'item1', name: 'Person 1' }],
        isActive: true,
        createdAt: { seconds: 1234567890, nanoseconds: 0 },
      }
      expect(isBoardTemplate(template)).toBe(true)
    })

    it('returns false for missing required fields', () => {
      expect(isBoardTemplate({ id: 'template1', name: 'Test' })).toBe(false)
    })
  })

  describe('isNotification', () => {
    it('returns true for valid friend request notification', () => {
      const notification = {
        id: 'notif1',
        userId: 'user1',
        type: 'friend_request',
        fromUserId: 'user2',
        fromUsername: 'johndoe',
        fromAvatarUrl: 'https://example.com/avatar.jpg',
        read: false,
        createdAt: { seconds: 1234567890, nanoseconds: 0 },
      }
      expect(isNotification(notification)).toBe(true)
    })

    it('returns true for all notification types', () => {
      const baseNotif = {
        id: 'notif1',
        userId: 'user1',
        fromUserId: 'user2',
        fromUsername: 'johndoe',
        fromAvatarUrl: 'https://example.com/avatar.jpg',
        read: false,
        createdAt: { seconds: 1234567890, nanoseconds: 0 },
      }
      expect(isNotification({ ...baseNotif, type: 'friend_request' })).toBe(true)
      expect(isNotification({ ...baseNotif, type: 'friend_accepted' })).toBe(true)
      expect(isNotification({ ...baseNotif, type: 'board_shared' })).toBe(true)
    })

    it('returns false for invalid notification type', () => {
      const notification = {
        id: 'notif1',
        userId: 'user1',
        type: 'invalid_type',
        fromUserId: 'user2',
        fromUsername: 'johndoe',
        fromAvatarUrl: 'https://example.com/avatar.jpg',
        read: false,
      }
      expect(isNotification(notification)).toBe(false)
    })
  })

  describe('sortUserIds', () => {
    it('sorts UIDs in alphabetical order', () => {
      expect(sortUserIds('alice', 'bob')).toEqual(['alice', 'bob'])
      expect(sortUserIds('bob', 'alice')).toEqual(['alice', 'bob'])
    })

    it('handles identical UIDs', () => {
      expect(sortUserIds('same', 'same')).toEqual(['same', 'same'])
    })
  })

  describe('generateFriendshipId', () => {
    it('generates consistent ID regardless of order', () => {
      const id1 = generateFriendshipId('alice', 'bob')
      const id2 = generateFriendshipId('bob', 'alice')
      expect(id1).toBe(id2)
      expect(id1).toBe('alice_bob')
    })
  })

  describe('createUserProfile', () => {
    it('creates user profile with defaults', () => {
      const profile = createUserProfile(
        'user123',
        'johndoe',
        'John Doe',
        'https://example.com/avatar.jpg'
      )
      expect(profile.uid).toBe('user123')
      expect(profile.username).toBe('johndoe')
      expect(profile.displayName).toBe('John Doe')
      expect(profile.avatarUrl).toBe('https://example.com/avatar.jpg')
      expect(profile.isSearchable).toBe(true)
      expect(profile.blockedUsers).toEqual([])
      expect(typeof profile.createdAt).toBe('number')
      expect(typeof profile.lastActive).toBe('number')
    })
  })

  describe('createBoardSharing', () => {
    it('creates default private sharing', () => {
      const sharing = createBoardSharing()
      expect(sharing.visibility).toBe('private')
      expect(sharing.publicLinkEnabled).toBe(false)
    })
  })
})
