import { useState, useCallback, useEffect, useRef } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Card } from '../lib/types'
import { RankCard } from './RankCard'
import { springConfig } from '../styles/tokens'
import { NicknameToggle } from './ui/NicknameToggle'
import { getSettings, saveSettings } from '../lib/storage'

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

const LONG_PRESS_DURATION = 500 // ms

/**
 * Individual draggable card wrapper with Framer Motion
 * Supports both drag handle click and long-press anywhere on card
 */
const DraggableCard = ({
  card,
  rank,
  thumbnailUrl,
  useNickname,
  onTap,
}: {
  card: Card
  rank: number
  thumbnailUrl?: string
  useNickname: boolean
  onTap: (id: string) => void
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const dragControls = useDragControls()
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null)

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsLongPressing(false)
  }

  const handlePointerDown = (e: ReactPointerEvent) => {
    const target = e.target as HTMLElement

    // Immediate drag if clicking the handle
    if (target.closest('[data-testid="drag-handle"]')) {
      dragControls.start(e)
      return
    }

    // Start long-press timer for anywhere else on the card
    longPressTriggered.current = false
    pointerStartPos.current = { x: e.clientX, y: e.clientY }
    setIsLongPressing(true)

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setIsLongPressing(false)
      dragControls.start(e)
    }, LONG_PRESS_DURATION)
  }

  const handlePointerMove = (e: ReactPointerEvent) => {
    // Cancel long-press if moved more than 10px (prevents accidental drag while scrolling)
    if (pointerStartPos.current && longPressTimer.current) {
      const dx = Math.abs(e.clientX - pointerStartPos.current.x)
      const dy = Math.abs(e.clientY - pointerStartPos.current.y)
      if (dx > 10 || dy > 10) {
        clearLongPress()
      }
    }
  }

  const handlePointerUp = () => {
    clearLongPress()
    pointerStartPos.current = null
  }

  const handlePointerCancel = () => {
    clearLongPress()
    pointerStartPos.current = null
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => clearLongPress()
  }, [])

  // Determine visual state
  const getAnimationState = () => {
    if (isDragging) {
      return {
        scale: 1.02,
        rotate: 1,
        zIndex: 50,
        boxShadow: '6px 6px 0px 0px #2d2d2d',
      }
    }
    if (isLongPressing) {
      return {
        scale: 0.98,
        rotate: -0.5,
        zIndex: 10,
        boxShadow: '2px 2px 0px 0px #2d2d2d',
      }
    }
    return {
      scale: 1,
      rotate: 0,
      zIndex: 0,
      boxShadow: '4px 4px 0px 0px #2d2d2d',
    }
  }

  return (
    <Reorder.Item
      value={card}
      id={card.id}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setIsDragging(false)
        setIsLongPressing(false)
        longPressTriggered.current = false
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        ...getAnimationState(),
      }}
      exit={{ opacity: 0, y: -20 }}
      transition={isLongPressing ? { duration: 0.15 } : springConfig.default}
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        className="select-none"
        style={{ touchAction: 'pan-y' }}
      >
        <RankCard
          id={card.id}
          name={card.name}
          nickname={card.nickname}
          rank={rank}
          thumbnailUrl={thumbnailUrl}
          notes={card.notes}
          isDragging={isDragging || isLongPressing}
          useNickname={useNickname}
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
 * - Drag from handle (immediate) or long-press anywhere (500ms)
 * - Visual feedback during long-press (card shrinks slightly)
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
  const [useNickname, setUseNickname] = useState(() => getSettings().nicknameModeRankList)

  // Toggle nickname mode and persist to settings
  const handleToggleNickname = useCallback(() => {
    setUseNickname(prev => {
      const newValue = !prev
      saveSettings({ nicknameModeRankList: newValue })
      return newValue
    })
  }, [])

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

  // Check if any cards have nicknames to show the toggle
  const hasAnyNicknames = orderedCards.some(card => card.nickname && card.nickname.trim() !== '')

  return (
    <div className="flex flex-col">
      {/* Nickname Toggle - only show if some cards have nicknames */}
      {hasAnyNicknames && (
        <div className="flex justify-end px-4 pt-2">
          <NicknameToggle enabled={useNickname} onToggle={handleToggleNickname} />
        </div>
      )}

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
            useNickname={useNickname}
            onTap={onCardTap}
          />
        ))}
      </Reorder.Group>
    </div>
  )
}
