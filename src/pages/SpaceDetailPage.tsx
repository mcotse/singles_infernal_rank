/**
 * SpaceDetailPage
 *
 * Shows boards within a space with "My Boards" / "All Boards" tabs.
 * Allows syncing local boards to the space.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { BoardGrid } from '../components/BoardGrid'
import { SpaceSettingsSheet } from '../components/SpaceSettingsSheet'
import { wobbly } from '../styles/wobbly'
import { useSpaceBoards } from '../hooks/useSpaceBoards'
import { useSpaceMembers } from '../hooks/useSpaceMembers'
import { useImageStorage } from '../hooks/useImageStorage'
import { getCardsByBoard, getBoards } from '../lib/storage'
import { getSpaceMembership } from '../lib/spaceStorage'
import type { Board } from '../lib/types'
import type { SpaceBoard } from '../lib/spaceTypes'

interface SpaceDetailPageProps {
  spaceId: string
  onBack: () => void
  onBoardSelect: (boardId: string, spaceContext?: { spaceId: string; ownerId: string }) => void
}

type TabId = 'my' | 'all'

/**
 * Filter dropdown for "All Boards" tab
 */
const MemberFilter = ({
  members,
  selectedMemberId,
  onSelect,
}: {
  members: { id: string; displayName: string; anonUid: string }[]
  selectedMemberId: string | null
  onSelect: (memberId: string | null) => void
}) => (
  <div className="flex gap-2 overflow-x-auto pb-2 px-4">
    <button
      onClick={() => onSelect(null)}
      className={`
        px-3 py-1 border-2 border-[#2d2d2d] text-sm whitespace-nowrap font-['Patrick_Hand']
        transition-all duration-100
        ${!selectedMemberId ? 'bg-[#2d2d2d] text-white' : 'bg-white text-[#2d2d2d]'}
      `}
      style={{ borderRadius: wobbly.pill }}
    >
      All
    </button>
    {members.map((m) => (
      <button
        key={m.id}
        onClick={() => onSelect(m.anonUid)}
        className={`
          px-3 py-1 border-2 border-[#2d2d2d] text-sm whitespace-nowrap font-['Patrick_Hand']
          transition-all duration-100
          ${selectedMemberId === m.anonUid ? 'bg-[#2d2d2d] text-white' : 'bg-white text-[#2d2d2d]'}
        `}
        style={{ borderRadius: wobbly.pill }}
      >
        {m.displayName}
      </button>
    ))}
  </div>
)

/**
 * Sync local board to space modal
 */
const SyncBoardModal = ({
  isOpen,
  onClose,
  localBoards,
  existingBoardIds,
  onSync,
}: {
  isOpen: boolean
  onClose: () => void
  localBoards: Board[]
  existingBoardIds: Set<string>
  onSync: (board: Board) => Promise<void>
}) => {
  const [isSyncing, setIsSyncing] = useState(false)

  if (!isOpen) return null

  const unsyncedBoards = localBoards.filter((b) => !existingBoardIds.has(b.id) && !b.deletedAt)

  const handleSync = async (board: Board) => {
    setIsSyncing(true)
    try {
      await onSync(board)
      onClose()
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={isSyncing ? undefined : onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-[#fdfbf7] border-[3px] border-[#2d2d2d] p-6 w-full max-w-sm max-h-[70vh] overflow-y-auto"
        style={{ borderRadius: wobbly.lg, boxShadow: '8px 8px 0px 0px #2d2d2d' }}
      >
        <h2
          className="text-2xl text-[#2d2d2d] mb-4"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
        >
          Share a Board
        </h2>

        {unsyncedBoards.length === 0 ? (
          <p
            className="text-[#9a958d] mb-4"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            All your boards are already shared to this space.
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            {unsyncedBoards.map((board) => (
              <button
                key={board.id}
                onClick={() => handleSync(board)}
                disabled={isSyncing}
                className="w-full text-left p-3 bg-white border-2 border-[#2d2d2d] hover:bg-[#fff9c4] transition-colors font-['Patrick_Hand'] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: wobbly.sm }}
              >
                {board.name}
              </button>
            ))}
          </div>
        )}

        <Button variant="secondary" onClick={onClose} className="w-full" disabled={isSyncing}>
          Cancel
        </Button>
      </motion.div>
    </div>
  )
}

export const SpaceDetailPage = ({
  spaceId,
  onBack,
  onBoardSelect,
}: SpaceDetailPageProps) => {
  const { allBoards, myBoards, syncBoard, canCreateBoard, error: boardError } = useSpaceBoards(spaceId)
  const { members, isAdmin, currentMemberId, removeMember } = useSpaceMembers(spaceId)
  const { getImageUrl } = useImageStorage()
  const [activeTab, setActiveTab] = useState<TabId>('my')
  const [filterByMember, setFilterByMember] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [coverImageUrls, setCoverImageUrls] = useState<Record<string, string>>({})

  const membership = getSpaceMembership(spaceId)

  // Get boards to display based on active tab
  const displayBoards = useMemo(() => {
    let boards: SpaceBoard[]
    if (activeTab === 'my') {
      boards = myBoards
    } else {
      boards = filterByMember
        ? allBoards.filter((b) => b.ownerId === filterByMember)
        : allBoards
    }
    return boards.filter((b) => !b.deletedAt)
  }, [activeTab, myBoards, allBoards, filterByMember])

  // Card counts
  const cardCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    displayBoards.forEach((board) => {
      counts[board.id] = getCardsByBoard(board.id).length
    })
    return counts
  }, [displayBoards])

  // Load cover images
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const urls: Record<string, string> = {}
      for (const board of displayBoards) {
        if (cancelled) return
        if (board.coverImage) {
          const url = await getImageUrl(board.coverImage)
          if (cancelled) return
          if (url) urls[board.id] = url
        }
      }
      setCoverImageUrls(urls)
    }
    load()
    return () => { cancelled = true }
  }, [displayBoards, getImageUrl])

  const existingBoardIds = useMemo(
    () => new Set(myBoards.map((b) => b.id)),
    [myBoards]
  )

  const handleSyncBoard = async (board: Board) => {
    await syncBoard(board, false)
  }

  // Handler that passes space context when clicking a board in the space
  const handleBoardClick = (boardId: string) => {
    const board = displayBoards.find((b) => b.id === boardId)
    if (board) {
      onBoardSelect(boardId, {
        spaceId,
        ownerId: board.ownerId,
      })
    } else {
      onBoardSelect(boardId)
    }
  }

  const handleLeaveSpace = async () => {
    // Handled by parent via onBack after leaveSpace
    onBack()
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'my', label: 'My Boards' },
    { id: 'all', label: 'All Boards' },
  ]

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur-sm border-b border-[#e5e0d8] px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="text-[#2d2d2d] text-xl p-1"
            aria-label="Back to spaces"
          >
            ←
          </button>
          <h1
            className="text-2xl text-[#2d2d2d] flex-1 truncate"
            style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
          >
            {membership?.spaceName ?? 'Space'}
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="text-xl p-1"
            aria-label="Space settings"
          >
            ⚙️
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setFilterByMember(null)
              }}
              className={`
                flex-1 py-2 border-2 border-[#2d2d2d] text-center font-['Patrick_Hand'] text-base
                transition-all duration-100
                ${activeTab === tab.id
                  ? 'bg-[#2d2d2d] text-white shadow-none'
                  : 'bg-white text-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]'
                }
              `}
              style={{ borderRadius: wobbly.sm }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Error banner */}
      {boardError && (
        <div
          className="mx-4 mt-3 p-3 bg-[#ffebee] border-2 border-[#ff4d4d] text-[#c62828] font-['Patrick_Hand']"
          style={{ borderRadius: wobbly.sm }}
        >
          {boardError}
        </div>
      )}

      {/* Member filter (All Boards tab only) */}
      {activeTab === 'all' && members.length > 1 && (
        <div className="pt-3">
          <MemberFilter
            members={members}
            selectedMemberId={filterByMember}
            onSelect={setFilterByMember}
          />
        </div>
      )}

      {/* Sync button */}
      {activeTab === 'my' && canCreateBoard && (
        <div className="px-4 pt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSyncModal(true)}
            className="w-full"
          >
            + Share a Board
          </Button>
        </div>
      )}

      {/* Board Grid */}
      {displayBoards.length > 0 ? (
        <BoardGrid
          boards={displayBoards}
          cardCounts={cardCounts}
          coverImageUrls={coverImageUrls}
          onBoardClick={handleBoardClick}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <span className="text-4xl mb-4 opacity-50">📋</span>
          <p
            className="text-[#9a958d]"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            {activeTab === 'my'
              ? 'Share a board to get started'
              : 'No boards shared yet'}
          </p>
        </div>
      )}

      {/* Settings Sheet */}
      <AnimatePresence>
        {showSettings && membership && (
          <SpaceSettingsSheet
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            spaceName={membership.spaceName}
            joinCode={membership.joinCode}
            members={members}
            isAdmin={isAdmin}
            currentMemberId={currentMemberId}
            onRemoveMember={removeMember}
            onLeaveSpace={handleLeaveSpace}
          />
        )}
      </AnimatePresence>

      {/* Sync Board Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <SyncBoardModal
            isOpen={showSyncModal}
            onClose={() => setShowSyncModal(false)}
            localBoards={getBoards()}
            existingBoardIds={existingBoardIds}
            onSync={handleSyncBoard}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
