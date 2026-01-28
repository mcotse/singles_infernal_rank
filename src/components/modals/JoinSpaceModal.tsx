/**
 * JoinSpaceModal
 *
 * Modal for joining a space via join code + display name.
 * Join code can be pre-filled from URL parameter.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { wobbly } from '../../styles/wobbly'
import { springConfig } from '../../styles/tokens'

interface JoinSpaceModalProps {
  isOpen: boolean
  onClose: () => void
  onJoin: (joinCode: string, displayName: string) => Promise<void>
  isLoading: boolean
  /** Pre-filled join code (e.g., from URL) */
  prefillCode?: string
  error?: string | null
}

export const JoinSpaceModal = ({
  isOpen,
  onClose,
  onJoin,
  isLoading,
  prefillCode,
  error,
}: JoinSpaceModalProps) => {
  const [joinCode, setJoinCode] = useState('')
  const [displayName, setDisplayName] = useState('')

  // Pre-fill join code when provided
  useEffect(() => {
    if (prefillCode) {
      setJoinCode(prefillCode)
    }
  }, [prefillCode])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.trim() && displayName.trim()) {
      await onJoin(joinCode.trim(), displayName.trim())
    }
  }

  const isValid = joinCode.trim().length > 0 && displayName.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={springConfig.bouncy}
        className="relative bg-[#fdfbf7] border-[3px] border-[#2d2d2d] p-6 w-full max-w-sm"
        style={{
          borderRadius: wobbly.lg,
          boxShadow: '8px 8px 0px 0px #2d2d2d',
        }}
      >
        <h2
          className="text-2xl text-[#2d2d2d] mb-4"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
        >
          Join a Space
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block mb-2 font-['Kalam'] text-lg text-[#2d2d2d]"
            >
              Join Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g., happy-tiger"
              autoFocus={!prefillCode}
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] placeholder:text-[#9a958d] font-['Patrick_Hand'] text-lg outline-none focus:border-[#2d5da1]"
              style={{ borderRadius: wobbly.sm }}
            />
          </div>

          <div className="mb-4">
            <label
              className="block mb-2 font-['Kalam'] text-lg text-[#2d2d2d]"
            >
              Your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Matt"
              autoFocus={!!prefillCode}
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] placeholder:text-[#9a958d] font-['Patrick_Hand'] text-lg outline-none focus:border-[#2d5da1]"
              style={{ borderRadius: wobbly.sm }}
            />
          </div>

          {error && (
            <div
              className="mb-4 p-3 bg-[#ffebee] border-2 border-[#ff4d4d] text-[#ff4d4d] font-['Patrick_Hand'] text-sm"
              style={{ borderRadius: wobbly.sm }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
