/**
 * SpaceSettingsSheet
 *
 * Bottom sheet showing space settings: join code, invite link, member management.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/Button'
import { wobbly } from '../styles/wobbly'
import { springConfig } from '../styles/tokens'
import type { SpaceMember } from '../lib/spaceTypes'

interface SpaceSettingsSheetProps {
  isOpen: boolean
  onClose: () => void
  spaceName: string
  joinCode: string
  members: SpaceMember[]
  isAdmin: boolean
  currentMemberId: string | null
  onRemoveMember: (memberId: string) => Promise<void>
  onLeaveSpace: () => Promise<void>
}

export const SpaceSettingsSheet = ({
  isOpen,
  onClose,
  spaceName,
  joinCode,
  members,
  isAdmin,
  currentMemberId,
  onRemoveMember,
  onLeaveSpace,
}: SpaceSettingsSheetProps) => {
  const [copied, setCopied] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const inviteUrl = `${window.location.origin}${window.location.pathname}?joinCode=${joinCode}`

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={springConfig.default}
        className="relative w-full max-w-[500px] bg-[#fdfbf7] border-t-[3px] border-x-[3px] border-[#2d2d2d] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[80vh] overflow-y-auto"
        style={{ borderRadius: `${wobbly.lg} ${wobbly.lg} 0 0` }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-[#e5e0d8] rounded-full" />
        </div>

        <h2
          className="text-2xl text-[#2d2d2d] mb-1"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
        >
          {spaceName}
        </h2>

        {/* Join Code */}
        <div
          className="mb-4 p-4 bg-white border-2 border-[#2d2d2d]"
          style={{ borderRadius: wobbly.sm, boxShadow: '4px 4px 0px 0px #2d2d2d' }}
        >
          <p
            className="text-[#9a958d] text-sm mb-1"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Join Code
          </p>
          <p
            className="text-[#2d2d2d] text-2xl mb-3"
            style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
          >
            {joinCode}
          </p>
          <div className="flex gap-2">
            <Button onClick={handleCopyCode} variant="secondary" size="sm" className="flex-1">
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
            <Button onClick={handleCopyLink} variant="secondary" size="sm" className="flex-1">
              Copy Invite Link
            </Button>
          </div>
        </div>

        {/* Members */}
        <div className="mb-4">
          <h3
            className="text-lg text-[#2d2d2d] mb-2"
            style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
          >
            Members ({members.length})
          </h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-white border-2 border-[#2d2d2d]"
                style={{ borderRadius: wobbly.sm }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 bg-[#e5e0d8] border-2 border-[#2d2d2d] flex items-center justify-center text-sm"
                    style={{ borderRadius: wobbly.circle }}
                  >
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="text-[#2d2d2d]"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    {member.displayName}
                  </span>
                  {member.role === 'admin' && (
                    <span
                      className="text-xs text-[#2d5da1] bg-[#e8f0fe] px-2 py-0.5 border border-[#2d5da1]"
                      style={{ borderRadius: wobbly.pill, fontFamily: "'Patrick Hand', cursive" }}
                    >
                      Admin
                    </span>
                  )}
                  {member.id === currentMemberId && (
                    <span
                      className="text-xs text-[#9a958d]"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      (you)
                    </span>
                  )}
                </div>
                {isAdmin && member.id !== currentMemberId && (
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="text-[#ff4d4d] text-sm font-['Patrick_Hand'] hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leave Space */}
        <AnimatePresence>
          {showLeaveConfirm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className="p-4 bg-[#fff5f5] border-2 border-[#ff4d4d]"
                style={{ borderRadius: wobbly.sm }}
              >
                <p
                  className="text-[#2d2d2d] mb-3"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Are you sure? You'll lose access to this space's boards.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <button
                    onClick={onLeaveSpace}
                    className="flex-1 px-4 py-2 bg-[#ff4d4d] text-white border-[3px] border-[#2d2d2d] font-['Patrick_Hand'] text-base shadow-[4px_4px_0px_0px_#2d2d2d] hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
                    style={{ borderRadius: wobbly.sm }}
                  >
                    Leave Space
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowLeaveConfirm(true)}
              className="w-full"
            >
              Leave Space
            </Button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
