/**
 * SpacesHomePage
 *
 * Home tab showing list of spaces the user has joined.
 * Create and Join buttons at the top.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { CreateSpaceModal } from '../components/modals/CreateSpaceModal'
import { JoinSpaceModal } from '../components/modals/JoinSpaceModal'
import { wobbly } from '../styles/wobbly'
import type { LocalSpaceMembership } from '../lib/spaceTypes'

interface SpacesHomePageProps {
  spaces: LocalSpaceMembership[]
  isLoading: boolean
  error: string | null
  canCreateSpace: boolean
  onCreateSpace: (spaceName: string, displayName: string) => Promise<boolean>
  onJoinSpace: (joinCode: string, displayName: string) => Promise<boolean>
  onSelectSpace: (spaceId: string) => void
  prefillJoinCode?: string
  clearError: () => void
}

/**
 * Empty state when no spaces joined
 */
const EmptyState = ({
  onCreateClick,
  onJoinClick,
}: {
  onCreateClick: () => void
  onJoinClick: () => void
}) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
    <div
      className="w-32 h-32 mb-6 border-[3px] border-dashed border-[#e5e0d8] flex items-center justify-center"
      style={{ borderRadius: wobbly.blob }}
    >
      <span className="text-6xl opacity-50">🏠</span>
    </div>

    <h2
      className="text-2xl text-[#2d2d2d] mb-2"
      style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
    >
      No spaces yet!
    </h2>

    <p
      className="text-[#9a958d] mb-8 max-w-[280px]"
      style={{ fontFamily: "'Patrick Hand', cursive" }}
    >
      Create a space to share rankings with friends, or join one with a code
    </p>

    <div className="flex gap-3 w-full max-w-[280px]">
      <Button onClick={onCreateClick} variant="primary" size="md" className="flex-1">
        Create
      </Button>
      <Button onClick={onJoinClick} variant="secondary" size="md" className="flex-1">
        Join
      </Button>
    </div>
  </div>
)

/**
 * Space card in the list
 */
const SpaceCard = ({
  space,
  onClick,
}: {
  space: LocalSpaceMembership
  onClick: () => void
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.98 }}
    className="w-full text-left p-4 bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0px_0px_#2d2d2d] hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
    style={{ borderRadius: wobbly.md }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 bg-[#fff9c4] border-2 border-[#2d2d2d] flex items-center justify-center text-2xl"
        style={{ borderRadius: wobbly.circle }}
      >
        🏠
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className="text-lg text-[#2d2d2d] truncate"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
        >
          {space.spaceName}
        </h3>
        <p
          className="text-[#9a958d] text-sm"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          {space.role === 'admin' ? 'Admin' : 'Member'} · {space.joinCode}
        </p>
      </div>
      <span className="text-[#9a958d] text-xl">→</span>
    </div>
  </motion.button>
)

export const SpacesHomePage = ({
  spaces,
  isLoading,
  error,
  canCreateSpace,
  onCreateSpace,
  onJoinSpace,
  onSelectSpace,
  prefillJoinCode,
  clearError,
}: SpacesHomePageProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(!!prefillJoinCode)

  const handleCreate = async (spaceName: string, displayName: string) => {
    const success = await onCreateSpace(spaceName, displayName)
    if (success) {
      setShowCreateModal(false)
    }
  }

  const handleJoin = async (joinCode: string, displayName: string) => {
    const success = await onJoinSpace(joinCode, displayName)
    if (success) {
      setShowJoinModal(false)
    }
  }

  const hasSpaces = spaces.length > 0

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur-sm border-b border-[#e5e0d8] px-4 py-4">
        <div className="flex items-center justify-between">
          <h1
            className="text-3xl text-[#2d2d2d]"
            style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
          >
            Spaces
          </h1>

          {hasSpaces && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  clearError()
                  setShowJoinModal(true)
                }}
              >
                Join
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  clearError()
                  setShowCreateModal(true)
                }}
                disabled={!canCreateSpace}
              >
                + New
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      {hasSpaces ? (
        <div className="p-4 space-y-3">
          <AnimatePresence>
            {spaces.map((space) => (
              <SpaceCard
                key={space.spaceId}
                space={space}
                onClick={() => onSelectSpace(space.spaceId)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          onCreateClick={() => {
            clearError()
            setShowCreateModal(true)
          }}
          onJoinClick={() => {
            clearError()
            setShowJoinModal(true)
          }}
        />
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateSpaceModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJoinModal && (
          <JoinSpaceModal
            isOpen={showJoinModal}
            onClose={() => setShowJoinModal(false)}
            onJoin={handleJoin}
            isLoading={isLoading}
            prefillCode={prefillJoinCode}
            error={error}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
