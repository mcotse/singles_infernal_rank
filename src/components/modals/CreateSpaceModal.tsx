/**
 * CreateSpaceModal
 *
 * Modal for creating a new space with a name and display name.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { wobbly } from '../../styles/wobbly'
import { springConfig } from '../../styles/tokens'

interface CreateSpaceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (spaceName: string, displayName: string) => Promise<void>
  isLoading: boolean
}

export const CreateSpaceModal = ({
  isOpen,
  onClose,
  onCreate,
  isLoading,
}: CreateSpaceModalProps) => {
  const [spaceName, setSpaceName] = useState('')
  const [displayName, setDisplayName] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (spaceName.trim() && displayName.trim()) {
      await onCreate(spaceName.trim(), displayName.trim())
      setSpaceName('')
      setDisplayName('')
    }
  }

  const isValid = spaceName.trim().length > 0 && displayName.trim().length > 0

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
          Create a Space
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block mb-2 font-['Kalam'] text-lg text-[#2d2d2d]"
            >
              Space Name
            </label>
            <input
              type="text"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="e.g., Singles Infernal S4"
              autoFocus
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] placeholder:text-[#9a958d] font-['Patrick_Hand'] text-lg outline-none focus:border-[#2d5da1]"
              style={{ borderRadius: wobbly.sm }}
            />
          </div>

          <div className="mb-6">
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
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] placeholder:text-[#9a958d] font-['Patrick_Hand'] text-lg outline-none focus:border-[#2d5da1]"
              style={{ borderRadius: wobbly.sm }}
            />
          </div>

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
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
