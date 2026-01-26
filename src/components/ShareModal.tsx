/**
 * ShareModal Component
 *
 * A quick share modal for selecting board visibility.
 * Provides one-tap options for common sharing scenarios.
 *
 * Features:
 * - Keep Private (no sharing)
 * - Friends Only (all friends can view)
 * - Public Link (anyone with link)
 * - Copy link button when public
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomSheet } from './ui/BottomSheet'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'
import type { BoardSharing } from '../lib/socialTypes'

export interface FriendInfo {
  uid: string
  displayName: string
  username: string
  avatarUrl: string
}

export interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  currentSharing: BoardSharing
  friends: FriendInfo[]
  onSave: (sharing: BoardSharing) => Promise<void>
  /** Optional public link ID for copy functionality */
  publicLinkId?: string
}

interface ShareOptionProps {
  icon: string
  label: string
  description: string
  isSelected: boolean
  onClick: () => void
  isLoading?: boolean
}

const ShareOption = ({
  icon,
  label,
  description,
  isSelected,
  onClick,
  isLoading,
}: ShareOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    aria-pressed={isSelected}
    className={`
      w-full flex items-start gap-3 p-4
      border-[3px] border-[#2d2d2d]
      transition-all
      ${isSelected
        ? 'bg-[#e5e0d8] shadow-[2px_2px_0px_0px_#2d2d2d]'
        : 'bg-white shadow-[4px_4px_0px_0px_#2d2d2d] hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px]'
      }
      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
    `}
    style={{ borderRadius: wobbly.md }}
  >
    {/* Icon */}
    <div
      className="
        w-10 h-10 flex-shrink-0
        bg-[#fdfbf7]
        border-2 border-[#2d2d2d]
        flex items-center justify-center
        text-xl
      "
      style={{ borderRadius: wobbly.circle }}
    >
      {icon}
    </div>

    {/* Text */}
    <div className="text-left">
      <span
        className="block text-[#2d2d2d] font-semibold"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        {label}
      </span>
      <span
        className="block text-sm text-[#2d2d2d]/60"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        {description}
      </span>
    </div>

    {/* Selected indicator */}
    {isSelected && (
      <div className="ml-auto flex-shrink-0 text-[#34a853] text-xl">✓</div>
    )}
  </button>
)

export const ShareModal = ({
  isOpen,
  onClose,
  currentSharing,
  friends,
  onSave,
  publicLinkId,
}: ShareModalProps) => {
  const [isSaving, setIsSaving] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Handle visibility change
  const handleVisibilityChange = useCallback(
    async (visibility: 'private' | 'friends' | 'public') => {
      setIsSaving(true)
      try {
        const newSharing: BoardSharing = {
          visibility,
          publicLinkEnabled: visibility === 'public',
          ...(visibility === 'public' && publicLinkId && { publicLinkId }),
        }
        await onSave(newSharing)
        onClose()
      } finally {
        setIsSaving(false)
      }
    },
    [onSave, onClose, publicLinkId]
  )

  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    const linkId = currentSharing.publicLinkId || publicLinkId
    if (!linkId) return

    const url = `${window.location.origin}/board/${linkId}`
    await navigator.clipboard.writeText(url)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }, [currentSharing.publicLinkId, publicLinkId])

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Share Board">
      <div className="space-y-3">
        {/* Private option */}
        <ShareOption
          icon="🔒"
          label="Keep Private"
          description="Only you can see this board"
          isSelected={currentSharing.visibility === 'private'}
          onClick={() => handleVisibilityChange('private')}
          isLoading={isSaving}
        />

        {/* Friends option */}
        <ShareOption
          icon="👥"
          label="Friends Only"
          description={`Share with ${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
          isSelected={currentSharing.visibility === 'friends'}
          onClick={() => handleVisibilityChange('friends')}
          isLoading={isSaving}
        />

        {/* Public option */}
        <ShareOption
          icon="🌐"
          label="Public Link"
          description="Anyone with the link can view"
          isSelected={currentSharing.visibility === 'public'}
          onClick={() => handleVisibilityChange('public')}
          isLoading={isSaving}
        />

        {/* Copy link button (when public) */}
        <AnimatePresence>
          {currentSharing.visibility === 'public' && currentSharing.publicLinkEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={springConfig.default}
              className="pt-2"
            >
              <button
                type="button"
                onClick={handleCopyLink}
                className={`
                  w-full py-3 px-4
                  border-2 border-[#2d2d2d]
                  transition-colors
                  ${copySuccess
                    ? 'bg-[#34a853] text-white'
                    : 'bg-[#2d5da1] text-white hover:bg-[#1e4a80]'
                  }
                `}
                style={{
                  borderRadius: wobbly.sm,
                  fontFamily: "'Patrick Hand', cursive",
                }}
              >
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  )
}
