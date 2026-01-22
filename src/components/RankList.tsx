import { useState, useCallback, useEffect } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import type { Card } from '../lib/types'
import { RankCard } from './RankCard'
import { springConfig } from '../styles/tokens'

export interface RankListProps {
  /** Cards to display, should be sorted by rank */
  cards: Card[]
  /** Map of card ID to thumbnail URL */
  thumbnailUrls?: Record<string, string>
  /** Called when cards are reordered */
  onReorder: (fromIndex: number, toIndex: number) => void
  /** Called when a card is tapped */
  onCardTap: (cardId: string) => void
}

/**
 * Empty state shown when no cards in the list
 */
const EmptyList = () => (
  <div
    data-testid="empty-list"
    className="flex flex-col items-center justify-center py-16 px-8 text-center"
  >
    <div className="text-6xl mb-4 opacity-50">🎯</div>
    <p
      className="text-[#9a958d] text-lg"
      style={{ fontFamily: "'Patrick Hand', cursive" }}
    >
      No items yet. Add your first ranking!
    </p>
  </div>
)

/**
 * Individual draggable card wrapper with Framer Motion
 */
const DraggableCard = ({
  card,
  rank,
  thumbnailUrl,
  onTap,
}: {
  card: Card
  rank: number
  thumbnailUrl?: string
  onTap: (id: string) => void
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={card}
      id={card.id}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
        rotate: isDragging ? 1 : 0,
        zIndex: isDragging ? 50 : 0,
      }}
      exit={{ opacity: 0, y: -20 }}
      transition={springConfig.default}
      whileDrag={{
        scale: 1.05,
        boxShadow: '8px 8px 0px 0px #2d2d2d',
        cursor: 'grabbing',
      }}
      layout
      layoutId={card.id}
      className="relative"
    >
      <div
        onPointerDown={(e) => {
          // Only start drag if clicking the handle
          const target = e.target as HTMLElement
          if (target.closest('[data-testid="drag-handle"]')) {
            dragControls.start(e)
          }
        }}
      >
        <RankCard
          id={card.id}
          name={card.name}
          rank={rank}
          thumbnailUrl={thumbnailUrl}
          notes={card.notes}
          isDragging={isDragging}
          onTap={onTap}
        />
      </div>
    </Reorder.Item>
  )
}

/**
 * RankList Component
 *
 * A vertically scrolling list of draggable ranked cards.
 * Uses Framer Motion Reorder for smooth drag-and-drop.
 *
 * Features:
 * - Drag from handle only (rest of card is tappable)
 * - Smooth spring animations during reorder
 * - Cards slide and wobble when displaced
 * - Rank badges update live during drag
 * - 50% overlap threshold for swap
 */
export const RankList = ({
  cards,
  thumbnailUrls = {},
  onReorder,
  onCardTap,
}: RankListProps) => {
  const [orderedCards, setOrderedCards] = useState(cards)

  // Keep local state in sync with props when cards change (edit, add, delete)
  useEffect(() => {
    // Create a map of new card data by ID for efficient lookup
    const cardMap = new Map(cards.map(c => [c.id, c]))

    setOrderedCards(prev => {
      // If card count changed (add/delete), use new cards array
      if (prev.length !== cards.length) {
        return cards
      }

      // Check if all IDs still exist
      const allIdsExist = prev.every(c => cardMap.has(c.id))
      if (!allIdsExist) {
        return cards
      }

      // Update card data while preserving drag order
      return prev.map(orderedCard => cardMap.get(orderedCard.id) || orderedCard)
    })
  }, [cards])

  const handleReorder = useCallback((newOrder: Card[]) => {
    // Find the indices that changed
    const oldOrder = orderedCards
    let fromIndex = -1
    let toIndex = -1

    // Find the card that moved
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].id !== oldOrder[i]?.id) {
        // Found a difference
        const movedCard = newOrder[i]
        fromIndex = oldOrder.findIndex(c => c.id === movedCard.id)
        toIndex = i
        break
      }
    }

    setOrderedCards(newOrder)

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex)
    }
  }, [orderedCards, onReorder])

  if (cards.length === 0) {
    return <EmptyList />
  }

  return (
    <Reorder.Group
      data-testid="rank-list"
      axis="y"
      values={orderedCards}
      onReorder={handleReorder}
      className="flex flex-col gap-3 p-4"
      layoutScroll
    >
      {orderedCards.map((card, index) => (
        <DraggableCard
          key={card.id}
          card={card}
          rank={index + 1}
          thumbnailUrl={thumbnailUrls[card.id]}
          onTap={onCardTap}
        />
      ))}
    </Reorder.Group>
  )
}
