import { useState, useMemo, useEffect } from 'react'
import { useBoards } from '../hooks/useBoards'
import { useImageStorage } from '../hooks/useImageStorage'
import { getCardsByBoard } from '../lib/storage'
import { BoardGrid } from '../components/BoardGrid'
import { Button } from '../components/ui/Button'
import { TemplatePickerSheet } from '../components/TemplatePickerSheet'
import { CreateBlankBoardModal } from '../components/CreateBlankBoardModal'
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
 * BoardsPage Component
 *
 * Main page showing all ranking boards in a 2-column grid.
 * Features:
 * - Header with title and create button
 * - Board grid with previews
 * - Empty state for first-time users
 * - Template picker for creating boards
 */
export const BoardsPage = ({ onBoardSelect }: BoardsPageProps) => {
  const { boards, createBoard, refresh } = useBoards()
  const { getImageUrl } = useImageStorage()
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showBlankBoardModal, setShowBlankBoardModal] = useState(false)
  const [coverImageUrls, setCoverImageUrls] = useState<Record<string, string>>({})

  // Calculate card counts for each board
  const cardCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    boards.forEach((board) => {
      counts[board.id] = getCardsByBoard(board.id).length
    })
    return counts
  }, [boards])

  // Load cover image URLs for boards with cover images - PARALLEL loading for speed
  useEffect(() => {
    let cancelled = false

    const loadCoverImages = async () => {
      // Load all cover images in parallel for much faster loading
      const boardsWithCovers = boards.filter(board => board.coverImage)

      const results = await Promise.all(
        boardsWithCovers.map(async (board) => {
          if (cancelled) return null
          const url = await getImageUrl(board.coverImage!)
          return url ? { boardId: board.id, url } : null
        })
      )

      if (!cancelled) {
        const urls: Record<string, string> = {}
        for (const result of results) {
          if (result) {
            urls[result.boardId] = result.url
          }
        }
        setCoverImageUrls(urls)
      }
    }
    loadCoverImages()

    return () => {
      cancelled = true
    }
  }, [boards, getImageUrl])

  // Get preview URLs (top 3 cards' thumbnails) for each board
  // TODO: Implement when image URLs are available from useImageStorage
  const previewUrls = useMemo(() => {
    const urls: Record<string, string[]> = {}
    // For now, return empty - will be populated when we have actual images
    return urls
  }, [])

  const handleCreateBlankBoard = (name: string) => {
    const board = createBoard(name)
    if (onBoardSelect) {
      onBoardSelect(board.id)
    }
  }

  const handleBoardCreatedFromTemplate = (boardId: string) => {
    // Refresh boards to pick up the newly created board
    refresh()
    if (onBoardSelect) {
      onBoardSelect(boardId)
    }
  }

  const handleBoardClick = (boardId: string) => {
    if (onBoardSelect) {
      onBoardSelect(boardId)
    }
  }

  const handleOpenTemplatePicker = () => {
    setShowTemplatePicker(true)
  }

  const handleOpenBlankModal = () => {
    setShowBlankBoardModal(true)
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
            onClick={handleOpenTemplatePicker}
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
          coverImageUrls={coverImageUrls}
          onBoardClick={handleBoardClick}
        />
      ) : (
        <EmptyState onCreate={handleOpenTemplatePicker} />
      )}

      {/* Template Picker Sheet */}
      <TemplatePickerSheet
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onBoardCreated={handleBoardCreatedFromTemplate}
        onCreateBlank={handleOpenBlankModal}
      />

      {/* Blank Board Modal */}
      <CreateBlankBoardModal
        isOpen={showBlankBoardModal}
        onClose={() => setShowBlankBoardModal(false)}
        onCreate={handleCreateBlankBoard}
      />
    </div>
  )
}
