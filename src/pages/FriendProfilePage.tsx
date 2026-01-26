/**
 * FriendProfilePage Component
 *
 * Shows a friend's profile with their shared boards.
 * Features:
 * - Friend avatar, name, and username
 * - List of shared boards (only those visible to current user)
 * - Board cards that navigate to board view
 * - Back button to return to friends list
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BoardCard } from '../components/BoardCard'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'
import { getUserById } from '../lib/firestoreUsers'
import { getCloudBoardsByOwner, filterVisibleBoards } from '../lib/firestoreBoards'
import type { UserProfile } from '../lib/socialTypes'
import type { CloudBoard } from '../lib/firestoreBoards'

export interface FriendProfilePageProps {
  /** The friend's user ID */
  friendId: string
  /** Current user's ID (for visibility checks) */
  currentUserId: string
  /** List of all friend IDs (for visibility checks) */
  friendIds: string[]
  /** Called when back button is clicked */
  onBack: () => void
  /** Called when a board is clicked */
  onViewBoard: (boardId: string) => void
}

/**
 * Get initials from display name for avatar fallback
 */
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return name.slice(0, 1).toUpperCase()
}

export const FriendProfilePage = ({
  friendId,
  currentUserId,
  friendIds,
  onBack,
  onViewBoard,
}: FriendProfilePageProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [boards, setBoards] = useState<CloudBoard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load friend profile and boards
  useEffect(() => {
    const loadFriendData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch profile and boards in parallel
        const [friendProfile, friendBoards] = await Promise.all([
          getUserById(friendId),
          getCloudBoardsByOwner(friendId),
        ])

        if (!friendProfile) {
          setError('Friend not found')
          return
        }

        setProfile(friendProfile)

        // Filter to only boards the current user can view
        const visibleBoards = filterVisibleBoards(friendBoards, currentUserId, friendIds)
        setBoards(visibleBoards)
      } catch (err) {
        console.error('Error loading friend data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load friend data')
      } finally {
        setIsLoading(false)
      }
    }

    loadFriendData()
  }, [friendId, currentUserId, friendIds])

  // Handle board click
  const handleBoardClick = useCallback(
    (boardId: string) => {
      onViewBoard(boardId)
    },
    [onViewBoard]
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div
          data-testid="loading-spinner"
          className="
            w-12 h-12
            border-4 border-[#e5e0d8]
            border-t-[#2d2d2d]
            animate-spin
          "
          style={{ borderRadius: wobbly.circle }}
        />
      </div>
    )
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={onBack}
          className="
            mb-4 px-3 py-2
            text-[#2d2d2d]
            border-2 border-[#2d2d2d]
            bg-white
            hover:bg-[#e5e0d8]
            transition-colors
          "
          style={{
            borderRadius: wobbly.sm,
            fontFamily: "'Patrick Hand', cursive",
          }}
          aria-label="Back"
        >
          ← Back
        </button>
        <div
          className="
            p-6 text-center
            bg-white
            border-[3px] border-[#ff4d4d]
          "
          style={{ borderRadius: wobbly.md }}
        >
          <p
            className="text-[#ff4d4d]"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            {error || 'Friend not found'}
          </p>
        </div>
      </div>
    )
  }

  const initials = getInitials(profile.displayName)

  return (
    <div className="p-4">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="
            mb-4 px-3 py-2
            text-[#2d2d2d]
            border-2 border-[#2d2d2d]
            bg-white
            hover:bg-[#e5e0d8]
            transition-colors
          "
          style={{
            borderRadius: wobbly.sm,
            fontFamily: "'Patrick Hand', cursive",
          }}
          aria-label="Back"
        >
          ← Back
        </button>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig.default}
          className="
            flex items-center gap-4
            p-4
            bg-white
            border-[3px] border-[#2d2d2d]
            shadow-[4px_4px_0px_0px_#2d2d2d]
          "
          style={{ borderRadius: wobbly.md }}
        >
          {/* Avatar */}
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={`${profile.displayName}'s avatar`}
              className="w-16 h-16 object-cover border-2 border-[#2d2d2d]"
              style={{ borderRadius: wobbly.circle }}
            />
          ) : (
            <div
              className="
                w-16 h-16
                bg-[#e5e0d8]
                border-2 border-[#2d2d2d]
                flex items-center justify-center
                text-[#2d2d2d]
                font-bold
                text-xl
              "
              style={{
                borderRadius: wobbly.circle,
                fontFamily: "'Kalam', cursive",
              }}
            >
              {initials}
            </div>
          )}

          {/* Name and username */}
          <div>
            <h1
              className="text-2xl text-[#2d2d2d]"
              style={{
                fontFamily: "'Kalam', cursive",
                fontWeight: 700,
              }}
            >
              {profile.displayName}
            </h1>
            <p
              className="text-[#2d2d2d]/60"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              @{profile.username}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Shared Boards Section */}
      <div>
        <h2
          className="text-lg text-[#2d2d2d] mb-4"
          style={{
            fontFamily: "'Kalam', cursive",
            fontWeight: 600,
          }}
        >
          Shared Boards ({boards.length})
        </h2>

        {boards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {boards.map((board, index) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...springConfig.default,
                  delay: index * 0.1,
                }}
              >
                <BoardCard
                  id={board.id}
                  name={board.name}
                  cardCount={0} // We don't have card counts for cloud boards yet
                  coverImageUrl={board.coverImage}
                  onClick={handleBoardClick}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfig.default}
            className="
              p-6 text-center
              bg-white
              border-[3px] border-[#2d2d2d]
              shadow-[4px_4px_0px_0px_#2d2d2d]
            "
            style={{ borderRadius: wobbly.md }}
          >
            <div
              className="
                w-16 h-16 mx-auto mb-4
                bg-[#e5e0d8]
                border-[3px] border-[#2d2d2d]
                flex items-center justify-center
                text-3xl
              "
              style={{ borderRadius: wobbly.circle }}
            >
              <span role="img" aria-label="no boards">
                📋
              </span>
            </div>

            <h3
              className="text-xl text-[#2d2d2d] mb-2"
              style={{
                fontFamily: "'Kalam', cursive",
                fontWeight: 700,
              }}
            >
              No Shared Boards
            </h3>

            <p
              className="text-[#2d2d2d]/70"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              {profile.displayName} hasn&apos;t shared any boards yet
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
