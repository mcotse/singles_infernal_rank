/**
 * Space System Types
 *
 * Types for the Spaces-based social system.
 * Spaces are shared rooms that users join via word-based codes.
 */

import type { Timestamp } from 'firebase/firestore'
import type { Board } from './types'

// ============ Space ============

export interface Space {
  id: string
  name: string
  joinCode: string
  createdBy: string // anon uid
  createdAt: Timestamp
  memberCount: number
}

// ============ Space Member ============

export type SpaceMemberRole = 'admin' | 'member'

export interface SpaceMember {
  id: string
  displayName: string
  deviceToken: string
  role: SpaceMemberRole
  joinedAt: Timestamp
  anonUid: string
}

// ============ Space Board ============

/**
 * SpaceBoard - A board within a space, stored in Firestore
 * Extends the local Board type with space-specific fields
 */
export interface SpaceBoard extends Board {
  spaceId: string
  ownerId: string // anon uid
  ownerName: string // display name at time of creation
  isDraft: boolean
  syncedAt: number
}

// ============ Space Card ============

/**
 * SpaceCard - A card synced to Firestore within a space board
 * Stores image URLs (Firebase Storage) instead of IndexedDB keys
 */
export interface SpaceCard {
  id: string
  boardId: string
  name: string
  nickname: string
  imageUrl: string | null  // Firebase Storage URL (full image)
  thumbnailUrl: string | null  // Firebase Storage URL (thumbnail)
  rank: number
  notes: string
  syncedAt: number
}

// ============ Local Membership ============

/**
 * LocalSpaceMembership - Stored in localStorage to track
 * which spaces this device has joined
 */
export interface LocalSpaceMembership {
  spaceId: string
  spaceName: string
  joinCode: string
  memberId: string
  displayName: string
  role: SpaceMemberRole
  joinedAt: number // Unix timestamp (ms)
}

// ============ Limits ============

export const SPACE_LIMITS = {
  /** Max spaces per device */
  maxSpacesPerDevice: 5,
  /** Max boards per user per space */
  maxBoardsPerUserPerSpace: 10,
} as const
