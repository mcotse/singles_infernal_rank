import type { Board } from '../lib/types'
import { BoardCard } from './BoardCard'

export interface BoardGridProps {
  /** List of boards to display */
  boards: Board[]
  /** Map of board ID to card count */
  cardCounts: Record<string, number>
  /** Map of board ID to preview thumbnail URLs (max 3 per board) */
  previewUrls?: Record<string, string[]>
  /** Called when a board card is clicked */
  onBoardClick: (boardId: string) => void
}

/**
 * BoardGrid Component
 *
 * A responsive 2-column grid displaying board preview cards.
 * Each card shows the board name, card count, and top 3 card
 * photos in an overlapping collage.
 *
 * Design: Cards are laid out like pinned notes on a corkboard,
 * with consistent spacing and a playful hand-drawn feel.
 */
export const BoardGrid = ({
  boards,
  cardCounts,
  previewUrls = {},
  onBoardClick,
}: BoardGridProps) => {
  return (
    <div
      data-testid="board-grid"
      className="grid grid-cols-2 gap-4 p-4"
    >
      {boards.map((board) => (
        <BoardCard
          key={board.id}
          id={board.id}
          name={board.name}
          cardCount={cardCounts[board.id] ?? 0}
          previewUrls={previewUrls[board.id]}
          coverImageUrl={board.coverImage}
          onClick={onBoardClick}
        />
      ))}
    </div>
  )
}
