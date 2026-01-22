import { useState, useMemo } from 'react'
import { useBoards } from '../hooks/useBoards'
import { getCardsByBoard } from '../lib/storage'
import { BoardGrid } from '../components/BoardGrid'
import { Button } from '../components/ui/Button'
import { wobbly } from '../styles/wobbly'

interface BoardsPageProps {
  /** Called when a board is selected for viewing */
  onBoardSelect?: (boardId: string) => void
}

/**
 * Empty state shown when no boards exist
 */
const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div
    data-testid="empty-state"
    className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center"
  >
    {/* Hand-drawn illustration placeholder */}
    <div
      className="w-32 h-32 mb-6 border-[3px] border-dashed border-[#e5e0d8] flex items-center justify-center"
      style={{ borderRadius: wobbly.blob }}
    >
      <span className="text-6xl opacity-50">📋</span>
    </div>

    <h2
      className="text-2xl text-[#2d2d2d] mb-2"
      style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
    >
      No rankings yet!
    </h2>

    <p
      className="text-[#9a958d] mb-8 max-w-[280px]"
      style={{ fontFamily: "'Patrick Hand', cursive" }}
    >
      Create your first ranking board and start organizing your favorites
    </p>

    <Button onClick={onCreate} variant="primary" size="lg">
      Create Your First Ranking
    </Button>
  </div>
)

/**
 * Simple create board modal
 */
const CreateBoardModal = ({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}) => {
  const [name, setName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim())
      setName('')
      onClose()
    }
  }

  return (
    <div
      data-testid="create-board-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-[#fdfbf7] border-[3px] border-[#2d2d2d] p-6 w-full max-w-sm shadow-[8px_8px_0px_0px_#2d2d2d]"
        style={{ borderRadius: wobbly.lg }}
      >
        <h2
          className="text-2xl text-[#2d2d2d] mb-4"
          style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
        >
          New Ranking Board
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name..."
            autoFocus
            className="w-full px-4 py-3 mb-4 border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] placeholder:text-[#9a958d]"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '1.125rem',
              borderRadius: wobbly.sm,
            }}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!name.trim()}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * BoardsPage Component
 *
 * Main page showing all ranking boards in a 2-column grid.
 * Features:
 * - Header with title and create button
 * - Board grid with previews
 * - Empty state for first-time users
 * - Create board modal
 */
export const BoardsPage = ({ onBoardSelect }: BoardsPageProps) => {
  const { boards, createBoard } = useBoards()
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Calculate card counts for each board
  const cardCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    boards.forEach((board) => {
      counts[board.id] = getCardsByBoard(board.id).length
    })
    return counts
  }, [boards])

  // Get preview URLs (top 3 cards' thumbnails) for each board
  // TODO: Implement when image URLs are available from useImageStorage
  const previewUrls = useMemo(() => {
    const urls: Record<string, string[]> = {}
    // For now, return empty - will be populated when we have actual images
    return urls
  }, [])

  const handleCreateBoard = (name: string) => {
    const board = createBoard(name)
    if (onBoardSelect) {
      onBoardSelect(board.id)
    }
  }

  const handleBoardClick = (boardId: string) => {
    if (onBoardSelect) {
      onBoardSelect(boardId)
    }
  }

  const hasBoards = boards.length > 0

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#fdfbf7]/95 backdrop-blur-sm border-b border-[#e5e0d8] px-4 py-4">
        <div className="flex items-center justify-between">
          <h1
            className="text-3xl text-[#2d2d2d]"
            style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}
          >
            My Rankings
          </h1>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            aria-label="Create new board"
          >
            + New
          </Button>
        </div>
      </header>

      {/* Content */}
      {hasBoards ? (
        <BoardGrid
          boards={boards}
          cardCounts={cardCounts}
          previewUrls={previewUrls}
          onBoardClick={handleBoardClick}
        />
      ) : (
        <EmptyState onCreate={() => setShowCreateModal(true)} />
      )}

      {/* Create Modal */}
      <CreateBoardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateBoard}
      />
    </div>
  )
}
