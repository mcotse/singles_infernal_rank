/**
 * useFriendBoards Hook
 *
 * Fetches and manages boards shared by friends.
 *
 * Features:
 * - Fetch boards for each friend
 * - Filter to only boards the user can view
 * - Compute shared board counts per friend
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CloudBoard } from '../lib/firestoreBoards'
import { getCloudBoardsByOwner, filterVisibleBoards } from '../lib/firestoreBoards'

/**
 * useFriendBoards options
 */
export interface UseFriendBoardsOptions {
  /** Current user's UID (null if not signed in) */
  userId: string | null
  /** List of friend user IDs */
  friendIds: string[]
}

/**
 * useFriendBoards return type
 */
export interface UseFriendBoardsReturn {
  /** Boards by friend ID (only visible boards) */
  friendBoards: Record<string, CloudBoard[]>
  /** Shared board count by friend ID */
  sharedBoardCounts: Record<string, number>
  /** Whether data is being loaded */
  isLoading: boolean
  /** Error message if any */
  error: string | null
  /** Refresh friend boards */
  refresh: () => Promise<void>
}

/**
 * Hook for fetching friend's boards
 */
export const useFriendBoards = (options: UseFriendBoardsOptions): UseFriendBoardsReturn => {
  const { userId, friendIds } = options

  const [friendBoards, setFriendBoards] = useState<Record<string, CloudBoard[]>>({})
  const [sharedBoardCounts, setSharedBoardCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use a stable reference for friendIds to avoid infinite loops
  // Create sorted copy to avoid mutating the input array
  const friendIdsKey = [...friendIds].sort().join(',')
  const friendIdsRef = useRef(friendIds)
  friendIdsRef.current = friendIds

  /**
   * Load boards for all friends
   */
  const loadFriendBoards = useCallback(async () => {
    const currentFriendIds = friendIdsRef.current
    if (!userId || currentFriendIds.length === 0) {
      setFriendBoards({})
      setSharedBoardCounts({})
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const boards: Record<string, CloudBoard[]> = {}
      const counts: Record<string, number> = {}

      // Fetch boards for each friend in parallel
      await Promise.all(
        currentFriendIds.map(async (friendId) => {
          try {
            const allFriendBoards = await getCloudBoardsByOwner(friendId)

            // Filter to only boards the user can view
            const visibleBoards = filterVisibleBoards(allFriendBoards, userId, currentFriendIds)

            boards[friendId] = visibleBoards
            counts[friendId] = visibleBoards.length
          } catch (err) {
            console.error(`Error fetching boards for friend ${friendId}:`, err)
            boards[friendId] = []
            counts[friendId] = 0
          }
        })
      )

      setFriendBoards(boards)
      setSharedBoardCounts(counts)
    } catch (err) {
      console.error('Error loading friend boards:', err)
      setError(err instanceof Error ? err.message : 'Failed to load friend boards')
    } finally {
      setIsLoading(false)
    }
  }, [userId, friendIdsKey])

  // Load data when userId or friendIds change
  useEffect(() => {
    loadFriendBoards()
  }, [loadFriendBoards])

  /**
   * Refresh friend boards
   */
  const refresh = useCallback(async () => {
    await loadFriendBoards()
  }, [loadFriendBoards])

  return {
    friendBoards,
    sharedBoardCounts,
    isLoading,
    error,
    refresh,
  }
}
