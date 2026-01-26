/**
 * useFriends Hook
 *
 * Manages friend state and operations.
 *
 * Features:
 * - List of active friends with their profiles
 * - Incoming and outgoing friend requests
 * - Send, accept, decline requests
 * - Unfriend and block users
 * - Refresh friends data
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Friendship, UserProfile } from '../lib/socialTypes'
import {
  getFriendships,
  getPendingRequests,
  createFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend,
  blockUser,
  type FriendshipResult,
} from '../lib/firestoreFriendships'
import { getUsersByIds } from '../lib/firestoreUsers'

/**
 * Friend with profile info
 */
export interface FriendWithProfile {
  friendship: Friendship
  profile: UserProfile
}

/**
 * Pending request with sender/recipient profile
 */
export interface RequestWithProfile {
  friendship: Friendship
  profile: UserProfile // Profile of the other user
}

/**
 * useFriends options
 */
export interface UseFriendsOptions {
  /** Current user's UID (null if not signed in) */
  userId: string | null
}

/**
 * useFriends return type
 */
export interface UseFriendsReturn {
  /** List of friends with their profiles */
  friends: FriendWithProfile[]
  /** Incoming friend requests (waiting for your response) */
  incomingRequests: RequestWithProfile[]
  /** Outgoing friend requests (waiting for their response) */
  outgoingRequests: RequestWithProfile[]
  /** Whether data is being loaded */
  isLoading: boolean
  /** Error message if any operation failed */
  error: string | null
  /** Count of incoming pending requests */
  pendingCount: number
  /** Send a friend request */
  sendRequest: (toUid: string) => Promise<FriendshipResult>
  /** Accept a friend request */
  acceptRequest: (friendshipId: string) => Promise<FriendshipResult>
  /** Decline a friend request */
  declineRequest: (friendshipId: string) => Promise<FriendshipResult>
  /** Remove a friend */
  removeFriend: (friendUid: string) => Promise<FriendshipResult>
  /** Block a user */
  blockFriend: (userUid: string) => Promise<FriendshipResult>
  /** Refresh friends data */
  refresh: () => Promise<void>
}

/**
 * Hook for managing friends
 */
export const useFriends = (options: UseFriendsOptions): UseFriendsReturn => {
  const { userId } = options

  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [incomingRequests, setIncomingRequests] = useState<RequestWithProfile[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<RequestWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pending count is just incoming requests
  const pendingCount = useMemo(() => incomingRequests.length, [incomingRequests])

  /**
   * Load all friends data
   */
  const loadFriendsData = useCallback(async () => {
    if (!userId) {
      setFriends([])
      setIncomingRequests([])
      setOutgoingRequests([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch all data in parallel
      const [friendships, incoming, outgoing] = await Promise.all([
        getFriendships(userId),
        getPendingRequests(userId, 'incoming'),
        getPendingRequests(userId, 'outgoing'),
      ])

      // Get all unique user IDs we need profiles for
      const friendUids = friendships.map((f) =>
        f.users[0] === userId ? f.users[1] : f.users[0]
      )
      const incomingUids = incoming.map((r) => r.requestedBy)
      const outgoingUids = outgoing.map((r) =>
        r.users[0] === userId ? r.users[1] : r.users[0]
      )

      const allUids = [...new Set([...friendUids, ...incomingUids, ...outgoingUids])]

      // Fetch all profiles
      const profiles = await getUsersByIds(allUids)
      const profileMap = new Map(profiles.map((p) => [p.uid, p]))

      // Build friends with profiles
      const friendsWithProfiles: FriendWithProfile[] = friendships
        .map((friendship) => {
          const friendUid = friendship.users[0] === userId ? friendship.users[1] : friendship.users[0]
          const profile = profileMap.get(friendUid)
          if (!profile) return null
          return { friendship, profile }
        })
        .filter((f): f is FriendWithProfile => f !== null)

      // Build incoming requests with profiles
      const incomingWithProfiles: RequestWithProfile[] = incoming
        .map((friendship) => {
          const profile = profileMap.get(friendship.requestedBy)
          if (!profile) return null
          return { friendship, profile }
        })
        .filter((r): r is RequestWithProfile => r !== null)

      // Build outgoing requests with profiles
      const outgoingWithProfiles: RequestWithProfile[] = outgoing
        .map((friendship) => {
          const recipientUid = friendship.users[0] === userId ? friendship.users[1] : friendship.users[0]
          const profile = profileMap.get(recipientUid)
          if (!profile) return null
          return { friendship, profile }
        })
        .filter((r): r is RequestWithProfile => r !== null)

      setFriends(friendsWithProfiles)
      setIncomingRequests(incomingWithProfiles)
      setOutgoingRequests(outgoingWithProfiles)
    } catch (err) {
      console.error('Error loading friends data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load friends')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Load data on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadFriendsData()
    }
  }, [userId, loadFriendsData])

  /**
   * Send a friend request
   */
  const sendRequest = useCallback(
    async (toUid: string): Promise<FriendshipResult> => {
      if (!userId) {
        return { success: false, error: 'Not signed in' }
      }

      const result = await createFriendRequest(userId, toUid)
      if (result.success) {
        // Refresh to update outgoing requests
        await loadFriendsData()
      }
      return result
    },
    [userId, loadFriendsData]
  )

  /**
   * Accept a friend request
   */
  const acceptRequest = useCallback(
    async (friendshipId: string): Promise<FriendshipResult> => {
      if (!userId) {
        return { success: false, error: 'Not signed in' }
      }

      const result = await acceptFriendRequest(friendshipId, userId)
      if (result.success) {
        // Refresh to update friends list
        await loadFriendsData()
      }
      return result
    },
    [userId, loadFriendsData]
  )

  /**
   * Decline a friend request
   */
  const declineRequest = useCallback(
    async (friendshipId: string): Promise<FriendshipResult> => {
      if (!userId) {
        return { success: false, error: 'Not signed in' }
      }

      const result = await declineFriendRequest(friendshipId, userId)
      if (result.success) {
        // Refresh to update incoming requests
        await loadFriendsData()
      }
      return result
    },
    [userId, loadFriendsData]
  )

  /**
   * Remove a friend
   */
  const removeFriend = useCallback(
    async (friendUid: string): Promise<FriendshipResult> => {
      if (!userId) {
        return { success: false, error: 'Not signed in' }
      }

      const result = await unfriend(userId, friendUid)
      if (result.success) {
        // Refresh to update friends list
        await loadFriendsData()
      }
      return result
    },
    [userId, loadFriendsData]
  )

  /**
   * Block a user
   */
  const blockFriend = useCallback(
    async (userUid: string): Promise<FriendshipResult> => {
      if (!userId) {
        return { success: false, error: 'Not signed in' }
      }

      const result = await blockUser(userId, userUid)
      if (result.success) {
        // Refresh to update friends list
        await loadFriendsData()
      }
      return result
    },
    [userId, loadFriendsData]
  )

  /**
   * Refresh friends data
   */
  const refresh = useCallback(async () => {
    await loadFriendsData()
  }, [loadFriendsData])

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    isLoading,
    error,
    pendingCount,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockFriend,
    refresh,
  }
}
