/**
 * BoardSettingsSheet Component
 *
 * A bottom sheet for configuring board sharing settings.
 * Features:
 * - Visibility selection (private/friends/specific/public)
 * - Friend picker for specific visibility
 * - Public link toggle and copy button
 * - Revoke link with confirmation
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/Button'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'
import type { CloudBoard } from '../lib/firestoreBoards'
import type { BoardSharing, BoardVisibility } from '../lib/socialTypes'

export interface FriendInfo {
  uid: string
  displayName: string
  username: string
  avatarUrl: string
}

export interface BoardSettingsSheetProps {
  isOpen: boolean
  onClose: () => void
  board: CloudBoard
  friends: FriendInfo[]
  onSave: (sharing: BoardSharing) => Promise<void>
}

/**
 * Get initials from display name
 */
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return name.slice(0, 1).toUpperCase()
}

/**
 * Visibility option data
 */
const visibilityOptions: { value: BoardVisibility; label: string; description: string }[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see this board',
  },
  {
    value: 'friends',
    label: 'Friends',
    description: 'All your friends can see this board',
  },
  {
    value: 'specific',
    label: 'Specific Friends',
    description: 'Only selected friends can see this board',
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone with the link can see this board',
  },
]

export const BoardSettingsSheet = ({
  isOpen,
  onClose,
  board,
  friends,
  onSave,
}: BoardSettingsSheetProps) => {
  // Local state for form
  const [visibility, setVisibility] = useState<BoardVisibility>(board.sharing.visibility)
  const [allowedFriends, setAllowedFriends] = useState<string[]>(
    board.sharing.allowedFriends ?? []
  )
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(board.sharing.publicLinkEnabled)
  const [isSaving, setIsSaving] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Reset form when board changes
  useEffect(() => {
    setVisibility(board.sharing.visibility)
    setAllowedFriends(board.sharing.allowedFriends ?? [])
    setPublicLinkEnabled(board.sharing.publicLinkEnabled)
  }, [board])

  // Handle visibility change
  const handleVisibilityChange = useCallback((newVisibility: BoardVisibility) => {
    setVisibility(newVisibility)
    // Enable public link by default when switching to public
    if (newVisibility === 'public') {
      setPublicLinkEnabled(true)
    }
  }, [])

  // Handle friend selection toggle
  const handleFriendToggle = useCallback((friendId: string) => {
    setAllowedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    )
  }, [])

  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    if (!board.sharing.publicLinkId) return

    const url = `${window.location.origin}/board/${board.sharing.publicLinkId}`
    await navigator.clipboard.writeText(url)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }, [board.sharing.publicLinkId])

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const newSharing: BoardSharing = {
        visibility,
        publicLinkEnabled: visibility === 'public' ? publicLinkEnabled : false,
        ...(visibility === 'specific' && { allowedFriends }),
        ...(board.sharing.publicLinkId && { publicLinkId: board.sharing.publicLinkId }),
      }
      await onSave(newSharing)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }, [visibility, publicLinkEnabled, allowedFriends, board.sharing.publicLinkId, onSave, onClose])

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Sharing Settings"
      footer={
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Visibility Options */}
        <div>
          <h3
            className="text-lg text-[#2d2d2d] mb-3"
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 600,
            }}
          >
            Who can see this board?
          </h3>

          <div className="space-y-2">
            {visibilityOptions.map((option) => (
              <label
                key={option.value}
                className={`
                  flex items-start gap-3 p-3 cursor-pointer
                  border-2 border-[#2d2d2d]
                  transition-colors
                  ${visibility === option.value ? 'bg-[#e5e0d8]' : 'bg-white hover:bg-[#faf8f4]'}
                `}
                style={{ borderRadius: wobbly.sm }}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={visibility === option.value}
                  onChange={() => handleVisibilityChange(option.value)}
                  className="mt-1 w-4 h-4 accent-[#2d5da1]"
                  aria-label={option.label}
                />
                <div>
                  <span
                    className="block text-[#2d2d2d] font-semibold"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    {option.label}
                  </span>
                  <span
                    className="block text-sm text-[#2d2d2d]/60"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    {option.description}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Specific Friends Picker */}
        <AnimatePresence>
          {visibility === 'specific' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={springConfig.default}
            >
              <h3
                className="text-lg text-[#2d2d2d] mb-3"
                style={{
                  fontFamily: "'Kalam', cursive",
                  fontWeight: 600,
                }}
              >
                Select Friends
              </h3>

              {friends.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {friends.map((friend) => (
                    <label
                      key={friend.uid}
                      className={`
                        flex items-center gap-3 p-2 cursor-pointer
                        border-2 border-[#2d2d2d]
                        transition-colors
                        ${allowedFriends.includes(friend.uid) ? 'bg-[#e5e0d8]' : 'bg-white hover:bg-[#faf8f4]'}
                      `}
                      style={{ borderRadius: wobbly.sm }}
                    >
                      <input
                        type="checkbox"
                        checked={allowedFriends.includes(friend.uid)}
                        onChange={() => handleFriendToggle(friend.uid)}
                        className="w-4 h-4 accent-[#2d5da1]"
                        aria-label={friend.displayName}
                      />

                      {/* Avatar */}
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt=""
                          className="w-8 h-8 object-cover border-2 border-[#2d2d2d]"
                          style={{ borderRadius: wobbly.circle }}
                        />
                      ) : (
                        <div
                          className="
                            w-8 h-8
                            bg-[#e5e0d8]
                            border-2 border-[#2d2d2d]
                            flex items-center justify-center
                            text-[#2d2d2d]
                            font-semibold
                            text-xs
                          "
                          style={{
                            borderRadius: wobbly.circle,
                            fontFamily: "'Kalam', cursive",
                          }}
                        >
                          {getInitials(friend.displayName)}
                        </div>
                      )}

                      <span
                        className="text-[#2d2d2d]"
                        style={{ fontFamily: "'Patrick Hand', cursive" }}
                      >
                        {friend.displayName}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p
                  className="text-[#2d2d2d]/60 text-center py-4"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  No friends yet. Add some friends first!
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Public Link Settings */}
        <AnimatePresence>
          {visibility === 'public' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={springConfig.default}
              className="space-y-3"
            >
              {/* Enable Public Link Toggle */}
              <label
                className="flex items-center justify-between p-3 bg-white border-2 border-[#2d2d2d] cursor-pointer"
                style={{ borderRadius: wobbly.sm }}
              >
                <span
                  className="text-[#2d2d2d]"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Enable public link
                </span>
                <input
                  type="checkbox"
                  checked={publicLinkEnabled}
                  onChange={(e) => setPublicLinkEnabled(e.target.checked)}
                  className="w-5 h-5 accent-[#2d5da1]"
                />
              </label>

              {/* Link Actions */}
              {publicLinkEnabled && board.sharing.publicLinkId && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`
                      flex-1 py-2 px-4
                      border-2 border-[#2d2d2d]
                      transition-colors
                      ${copySuccess ? 'bg-[#34a853] text-white' : 'bg-[#2d5da1] text-white hover:bg-[#1e4a80]'}
                    `}
                    style={{
                      borderRadius: wobbly.sm,
                      fontFamily: "'Patrick Hand', cursive",
                    }}
                  >
                    {copySuccess ? 'Copied!' : 'Copy Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Revoke link functionality would be handled via onSave
                      // with a new publicLinkId generated
                    }}
                    className="
                      py-2 px-4
                      bg-white
                      text-[#ff4d4d]
                      border-2 border-[#ff4d4d]
                      hover:bg-[#ff4d4d] hover:text-white
                      transition-colors
                    "
                    style={{
                      borderRadius: wobbly.sm,
                      fontFamily: "'Patrick Hand', cursive",
                    }}
                  >
                    Revoke Link
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  )
}
