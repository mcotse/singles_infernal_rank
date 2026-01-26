/**
 * useComparison Hook
 *
 * Manages board comparison between users.
 *
 * Features:
 * - Find matchable boards (by templateId or exact title)
 * - Comparison suggestions when viewing a friend's board
 * - Agreement percentage calculation
 */

import { useMemo, useCallback } from 'react'
import type { Board, Card } from '../lib/types'
import type { CloudBoard } from '../lib/firestoreBoards'
import { areTemplateMatching, areTitlesMatching } from '../lib/firestoreTemplates'

/**
 * A comparison match between two boards
 */
export interface ComparisonMatch {
  /** Your board */
  yourBoard: Board
  /** Friend's board */
  friendBoard: CloudBoard
  /** Match type: template-based or title-based */
  matchType: 'template' | 'title'
  /** Friend's user ID */
  friendId: string
  /** Friend's display name */
  friendName: string
}

/**
 * Ranked item for comparison (unified format for local/cloud)
 */
export interface ComparisonItem {
  /** Unique identifier (cardId or templateItemId) */
  id: string
  /** Display name */
  name: string
  /** Rank in this board (1-indexed, or null if not ranked) */
  rank: number | null
  /** Thumbnail/image URL */
  imageUrl?: string
}

/**
 * Comparison result for two boards
 */
export interface ComparisonResult {
  /** Your items with ranks */
  yourItems: ComparisonItem[]
  /** Friend's items with ranks */
  friendItems: ComparisonItem[]
  /** All unique items from both boards, aligned for side-by-side display */
  alignedItems: AlignedComparisonItem[]
  /** Agreement percentage (0-100) */
  agreementPercentage: number
}

/**
 * Aligned item for side-by-side display
 */
export interface AlignedComparisonItem {
  /** The item identifier */
  id: string
  /** The item name */
  name: string
  /** Your rank for this item (null if not ranked) */
  yourRank: number | null
  /** Friend's rank for this item (null if not ranked) */
  friendRank: number | null
  /** Your image URL */
  yourImageUrl?: string
  /** Friend's image URL */
  friendImageUrl?: string
}

/**
 * Options for useComparison hook
 */
export interface UseComparisonOptions {
  /** Your boards */
  yourBoards: Board[]
  /** Your cards (for looking up card details) */
  yourCards: Card[]
  /** Friend boards (CloudBoards from friends) */
  friendBoards: CloudBoard[]
  /** Friend names map (friendId -> displayName) */
  friendNames: Record<string, string>
}

/**
 * Return type for useComparison hook
 */
export interface UseComparisonReturn {
  /** All possible comparison matches */
  matches: ComparisonMatch[]
  /** Get matches for a specific friend */
  getMatchesForFriend: (friendId: string) => ComparisonMatch[]
  /** Get matches for a specific board of yours */
  getMatchesForBoard: (boardId: string) => ComparisonMatch[]
  /** Check if a friend's board matches any of your boards */
  findMatchForFriendBoard: (friendBoardId: string) => ComparisonMatch | null
  /** Calculate comparison result for two boards */
  calculateComparison: (
    yourBoard: Board,
    yourCards: Card[],
    friendBoard: CloudBoard,
    friendCards: Card[]
  ) => ComparisonResult
}

/**
 * Calculate agreement percentage between two ranked lists
 *
 * Algorithm:
 * 1. Find common items (present in both lists)
 * 2. For each common item, calculate position difference
 * 3. Score based on proximity: same rank = 100%, off by 1 = 80%, etc.
 * 4. Average all scores
 *
 * Returns 0 if no common items, 100 if perfect match
 */
export const calculateAgreement = (
  items1: ComparisonItem[],
  items2: ComparisonItem[]
): number => {
  // Get ranked items only
  const ranked1 = items1.filter((item) => item.rank !== null)
  const ranked2 = items2.filter((item) => item.rank !== null)

  if (ranked1.length === 0 || ranked2.length === 0) {
    return 0
  }

  // Create lookup maps
  const rank1Map = new Map(ranked1.map((item) => [item.id, item.rank!]))
  const rank2Map = new Map(ranked2.map((item) => [item.id, item.rank!]))

  // Find common items
  const commonIds = [...rank1Map.keys()].filter((id) => rank2Map.has(id))

  if (commonIds.length === 0) {
    return 0
  }

  // Calculate max possible rank difference (for normalization)
  const maxRank = Math.max(ranked1.length, ranked2.length)

  // Calculate agreement score
  let totalScore = 0

  for (const id of commonIds) {
    const rank1 = rank1Map.get(id)!
    const rank2 = rank2Map.get(id)!
    const diff = Math.abs(rank1 - rank2)

    // Score: 1 for perfect match, decreasing as difference increases
    // Using inverse linear scale: score = 1 - (diff / maxRank)
    const score = Math.max(0, 1 - diff / maxRank)
    totalScore += score
  }

  // Calculate percentage
  const percentage = (totalScore / commonIds.length) * 100

  return Math.round(percentage)
}

/**
 * Align items from two boards for side-by-side comparison
 * Shows all items from both boards, sorted by average rank
 */
export const alignItemsForComparison = (
  yourItems: ComparisonItem[],
  friendItems: ComparisonItem[]
): AlignedComparisonItem[] => {
  // Create lookup maps
  const yourMap = new Map(yourItems.map((item) => [item.id, item]))
  const friendMap = new Map(friendItems.map((item) => [item.id, item]))

  // Get all unique IDs
  const allIds = new Set([...yourMap.keys(), ...friendMap.keys()])

  // Create aligned items
  const aligned: AlignedComparisonItem[] = []

  for (const id of allIds) {
    const yours = yourMap.get(id)
    const friend = friendMap.get(id)

    aligned.push({
      id,
      name: yours?.name ?? friend?.name ?? 'Unknown',
      yourRank: yours?.rank ?? null,
      friendRank: friend?.rank ?? null,
      yourImageUrl: yours?.imageUrl,
      friendImageUrl: friend?.imageUrl,
    })
  }

  // Sort by average rank (items with ranks first, then unranked)
  aligned.sort((a, b) => {
    const avgA =
      a.yourRank !== null && a.friendRank !== null
        ? (a.yourRank + a.friendRank) / 2
        : a.yourRank ?? a.friendRank ?? Infinity
    const avgB =
      b.yourRank !== null && b.friendRank !== null
        ? (b.yourRank + b.friendRank) / 2
        : b.yourRank ?? b.friendRank ?? Infinity

    return avgA - avgB
  })

  return aligned
}

/**
 * Hook for managing board comparisons
 */
export const useComparison = (options: UseComparisonOptions): UseComparisonReturn => {
  const { yourBoards, friendBoards, friendNames } = options

  /**
   * Find all comparison matches
   */
  const matches = useMemo(() => {
    const result: ComparisonMatch[] = []

    for (const yourBoard of yourBoards) {
      // Skip deleted boards
      if (yourBoard.deletedAt !== null) continue

      for (const friendBoard of friendBoards) {
        // Check for template match
        if (areTemplateMatching(yourBoard.templateId, friendBoard.templateId)) {
          result.push({
            yourBoard,
            friendBoard,
            matchType: 'template',
            friendId: friendBoard.ownerId,
            friendName: friendNames[friendBoard.ownerId] ?? 'Friend',
          })
          continue // Don't check title if template matches
        }

        // Check for exact title match
        if (areTitlesMatching(yourBoard.name, friendBoard.name)) {
          result.push({
            yourBoard,
            friendBoard,
            matchType: 'title',
            friendId: friendBoard.ownerId,
            friendName: friendNames[friendBoard.ownerId] ?? 'Friend',
          })
        }
      }
    }

    return result
  }, [yourBoards, friendBoards, friendNames])

  /**
   * Get matches for a specific friend
   */
  const getMatchesForFriend = useCallback(
    (friendId: string): ComparisonMatch[] => {
      return matches.filter((match) => match.friendId === friendId)
    },
    [matches]
  )

  /**
   * Get matches for a specific board of yours
   */
  const getMatchesForBoard = useCallback(
    (boardId: string): ComparisonMatch[] => {
      return matches.filter((match) => match.yourBoard.id === boardId)
    },
    [matches]
  )

  /**
   * Find a match for a friend's board
   */
  const findMatchForFriendBoard = useCallback(
    (friendBoardId: string): ComparisonMatch | null => {
      return matches.find((match) => match.friendBoard.id === friendBoardId) ?? null
    },
    [matches]
  )

  /**
   * Calculate comparison result for two boards
   */
  const calculateComparison = useCallback(
    (
      _yourBoard: Board,
      yourBoardCards: Card[],
      _friendBoard: CloudBoard,
      friendCards: Card[]
    ): ComparisonResult => {
      // Convert to ComparisonItems
      const yourItems: ComparisonItem[] = yourBoardCards.map((card) => ({
        id:
          (card.metadata?.templateItemId as string) ?? // Use templateItemId if available
          card.id,
        name: card.name,
        rank: card.rank,
        imageUrl: card.thumbnailKey ?? undefined,
      }))

      const friendItems: ComparisonItem[] = friendCards.map((card) => ({
        id:
          (card.metadata?.templateItemId as string) ?? // Use templateItemId if available
          card.id,
        name: card.name,
        rank: card.rank,
        imageUrl: card.thumbnailKey ?? undefined,
      }))

      // Align items for side-by-side display
      const alignedItems = alignItemsForComparison(yourItems, friendItems)

      // Calculate agreement
      const agreementPercentage = calculateAgreement(yourItems, friendItems)

      return {
        yourItems,
        friendItems,
        alignedItems,
        agreementPercentage,
      }
    },
    []
  )

  return {
    matches,
    getMatchesForFriend,
    getMatchesForBoard,
    findMatchForFriendBoard,
    calculateComparison,
  }
}
