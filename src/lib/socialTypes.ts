/**
 * Social Features Data Types
 *
 * Types for Firebase-backed social features:
 * - User profiles and authentication
 * - Friendships and friend requests
 * - Board sharing and visibility
 * - Templates for comparison
 * - Notifications
 */

import { Timestamp } from 'firebase/firestore'

// ============ User Profile ============

/**
 * UserProfile - Public profile stored in Firestore
 */
export interface UserProfile {
  uid: string                 // Firebase Auth UID
  username: string            // Unique, user-chosen (3-20 chars, alphanumeric + underscore)
  displayName: string         // From Google Sign-In
  avatarUrl: string           // Google profile picture URL
  isSearchable: boolean       // Can be found via username search
  blockedUsers: string[]      // UIDs of blocked users
  createdAt: Timestamp
  lastActive: Timestamp
}

/**
 * Create a new UserProfile (for local use before Firestore)
 */
export const createUserProfile = (
  uid: string,
  username: string,
  displayName: string,
  avatarUrl: string
): Omit<UserProfile, 'createdAt' | 'lastActive'> & { createdAt: number; lastActive: number } => ({
  uid,
  username,
  displayName,
  avatarUrl,
  isSearchable: true,
  blockedUsers: [],
  createdAt: Date.now(),
  lastActive: Date.now(),
})

/**
 * Type guard for UserProfile
 */
export const isUserProfile = (obj: unknown): obj is UserProfile => {
  if (typeof obj !== 'object' || obj === null) return false
  const p = obj as Record<string, unknown>
  return (
    typeof p.uid === 'string' &&
    typeof p.username === 'string' &&
    typeof p.displayName === 'string' &&
    typeof p.avatarUrl === 'string' &&
    typeof p.isSearchable === 'boolean' &&
    Array.isArray(p.blockedUsers)
  )
}

// ============ Friendships ============

export type FriendshipStatus = 'pending' | 'active'

/**
 * Friendship - Relationship between two users
 * Stored with sorted UIDs to ensure uniqueness
 */
export interface Friendship {
  id: string
  users: [string, string]     // Sorted UIDs for consistent lookups
  status: FriendshipStatus
  requestedBy: string         // UID of user who initiated
  createdAt: Timestamp
  acceptedAt?: Timestamp
}

/**
 * Sort two UIDs consistently for friendship document ID
 */
export const sortUserIds = (uid1: string, uid2: string): [string, string] => {
  return uid1 < uid2 ? [uid1, uid2] : [uid2, uid1]
}

/**
 * Generate friendship document ID from two UIDs
 */
export const generateFriendshipId = (uid1: string, uid2: string): string => {
  const [a, b] = sortUserIds(uid1, uid2)
  return `${a}_${b}`
}

/**
 * Type guard for Friendship
 */
export const isFriendship = (obj: unknown): obj is Friendship => {
  if (typeof obj !== 'object' || obj === null) return false
  const f = obj as Record<string, unknown>
  return (
    typeof f.id === 'string' &&
    Array.isArray(f.users) &&
    f.users.length === 2 &&
    typeof f.users[0] === 'string' &&
    typeof f.users[1] === 'string' &&
    (f.status === 'pending' || f.status === 'active') &&
    typeof f.requestedBy === 'string'
  )
}

// ============ Board Sharing ============

export type BoardVisibility = 'private' | 'friends' | 'specific' | 'public'

/**
 * BoardSharing - Visibility settings for a board
 */
export interface BoardSharing {
  visibility: BoardVisibility
  allowedFriends?: string[]   // UIDs for 'specific' visibility
  publicLinkEnabled: boolean
  publicLinkId?: string       // Random ID for public link
}

/**
 * Create default sharing settings (private)
 */
export const createBoardSharing = (): BoardSharing => ({
  visibility: 'private',
  publicLinkEnabled: false,
})

/**
 * Type guard for BoardSharing
 */
export const isBoardSharing = (obj: unknown): obj is BoardSharing => {
  if (typeof obj !== 'object' || obj === null) return false
  const s = obj as Record<string, unknown>
  return (
    (s.visibility === 'private' ||
      s.visibility === 'friends' ||
      s.visibility === 'specific' ||
      s.visibility === 'public') &&
    typeof s.publicLinkEnabled === 'boolean'
  )
}

// ============ Cloud Board Extensions ============

/**
 * CloudBoardData - Additional fields for synced boards
 * These are optional extensions to the local Board type
 */
export interface CloudBoardData {
  ownerId: string             // Firebase UID of owner
  sharing: BoardSharing
  syncedAt: number            // Last sync timestamp (ms)
  templateId?: string         // If created from a template
}

// ============ Templates ============

/**
 * TemplateItem - A single item in a template
 */
export interface TemplateItem {
  id: string
  name: string                // Locked, cannot be changed
  defaultImageUrl?: string    // Optional default image
}

/**
 * BoardTemplate - Predefined board structure for comparison
 */
export interface BoardTemplate {
  id: string
  name: string                // Locked, e.g., "Singles Inferno S5"
  description: string
  category: string            // e.g., "Reality TV", "Sports", "Music"
  items: TemplateItem[]
  isActive: boolean           // Whether template is available
  createdAt: Timestamp
}

/**
 * Type guard for TemplateItem
 */
export const isTemplateItem = (obj: unknown): obj is TemplateItem => {
  if (typeof obj !== 'object' || obj === null) return false
  const t = obj as Record<string, unknown>
  return typeof t.id === 'string' && typeof t.name === 'string'
}

/**
 * Type guard for BoardTemplate
 */
export const isBoardTemplate = (obj: unknown): obj is BoardTemplate => {
  if (typeof obj !== 'object' || obj === null) return false
  const t = obj as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.description === 'string' &&
    typeof t.category === 'string' &&
    Array.isArray(t.items) &&
    typeof t.isActive === 'boolean'
  )
}

// ============ Notifications ============

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'board_shared'

/**
 * Notification - In-app notification for social events
 */
export interface Notification {
  id: string
  userId: string              // Recipient UID
  type: NotificationType
  fromUserId: string          // Sender UID
  fromUsername: string        // Denormalized for display
  fromAvatarUrl: string       // Denormalized for display
  data?: Record<string, unknown> // Type-specific data
  read: boolean
  createdAt: Timestamp
}

/**
 * Type guard for Notification
 */
export const isNotification = (obj: unknown): obj is Notification => {
  if (typeof obj !== 'object' || obj === null) return false
  const n = obj as Record<string, unknown>
  return (
    typeof n.id === 'string' &&
    typeof n.userId === 'string' &&
    (n.type === 'friend_request' ||
      n.type === 'friend_accepted' ||
      n.type === 'board_shared') &&
    typeof n.fromUserId === 'string' &&
    typeof n.fromUsername === 'string' &&
    typeof n.read === 'boolean'
  )
}

// ============ Report System ============

export type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'impersonation'
  | 'other'

/**
 * Report - User report for moderation
 */
export interface Report {
  id: string
  reporterId: string          // UID of reporter
  reportedUserId: string      // UID of reported user
  reportedBoardId?: string    // Optional: specific board
  reason: ReportReason
  details: string
  status: 'pending' | 'reviewed' | 'dismissed'
  createdAt: Timestamp
}
