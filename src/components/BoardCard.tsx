import { type KeyboardEvent } from 'react'
import { wobbly } from '../styles/wobbly'
import { shadows } from '../styles/tokens'

export interface BoardCardProps {
  /** Unique board ID */
  id: string
  /** Board name to display */
  name: string
  /** Number of cards in the board */
  cardCount: number
  /** URLs for top 3 card thumbnail previews (overlapping collage) */
  previewUrls?: string[]
  /** Cover image URL for the board background */
  coverImageUrl?: string | null
  /** Click handler - receives board ID */
  onClick: (id: string) => void
}

/**
 * Corner tape decoration - tilted translucent strip
 */
const CornerTape = ({ position }: { position: 'top-left' | 'top-right' }) => {
  const isLeft = position === 'top-left'
  return (
    <div
      data-testid="corner-tape"
      className={`
        absolute z-10 w-8 h-3
        bg-amber-100/70 border border-amber-200/50
        ${isLeft ? '-top-1 -left-1 rotate-[-35deg]' : '-top-1 -right-1 rotate-[35deg]'}
      `}
      style={{
        borderRadius: '1px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}
    />
  )
}

/**
 * Empty preview placeholder - shows when no cards yet
 */
const EmptyPreview = () => (
  <div
    data-testid="empty-preview"
    className="w-full h-full flex items-center justify-center"
  >
    <div
      className="w-12 h-12 border-2 border-dashed border-[#e5e0d8] flex items-center justify-center text-[#e5e0d8]"
      style={{ borderRadius: wobbly.circle }}
    >
      <span className="text-2xl font-bold" style={{ fontFamily: "'Kalam', cursive" }}>?</span>
    </div>
  </div>
)

/**
 * Photo preview collage - overlapping circular photos
 */
const PhotoPreviewCollage = ({ urls }: { urls: string[] }) => {
  // Only show max 3 photos
  const displayUrls = urls.slice(0, 3)

  if (displayUrls.length === 0) {
    return <EmptyPreview />
  }

  // Calculate positions for overlapping effect
  // Photos stack from right to left, with the first (highest ranked) on top
  const getPosition = (index: number, total: number) => {
    const baseSize = 40 // Base photo size in pixels
    const overlap = 12 // How much photos overlap
    const totalWidth = baseSize + (total - 1) * (baseSize - overlap)
    const startX = (80 - totalWidth) / 2 // Center in container (80px wide area)

    return {
      left: startX + index * (baseSize - overlap),
      zIndex: total - index, // First photo has highest z-index
      rotate: (index - 1) * 5, // Slight rotation for natural look
    }
  }

  return (
    <div className="relative w-20 h-12 mx-auto">
      {displayUrls.map((url, index) => {
        const pos = getPosition(index, displayUrls.length)
        return (
          <div
            key={index}
            data-testid="preview-photo"
            className="absolute w-10 h-10 border-2 border-[#2d2d2d] bg-white overflow-hidden"
            style={{
              borderRadius: wobbly.circle,
              left: pos.left,
              top: '50%',
              transform: `translateY(-50%) rotate(${pos.rotate}deg)`,
              zIndex: pos.zIndex,
              boxShadow: shadows.sm,
            }}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )
      })}
    </div>
  )
}

/**
 * Background pattern - dot grid for when no cover image
 */
const PatternBackground = () => (
  <div
    data-testid="board-background"
    className="absolute inset-0 opacity-30"
    style={{
      backgroundImage: 'radial-gradient(#2d2d2d 1px, transparent 1px)',
      backgroundSize: '12px 12px',
      borderRadius: 'inherit',
    }}
  />
)

/**
 * BoardCard Component
 *
 * A tappable card showing a board preview with:
 * - Cover image or pattern background
 * - Top 3 card photos in an overlapping collage
 * - Board name with hand-drawn typography
 * - Card count badge
 * - Tape decorations on corners
 *
 * Design: Hand-drawn aesthetic with wobbly borders,
 * warm paper tones, and playful decorations that feel
 * like a pinned note on a corkboard.
 */
export const BoardCard = ({
  id,
  name,
  cardCount,
  previewUrls = [],
  coverImageUrl,
  onClick,
}: BoardCardProps) => {
  const handleClick = () => onClick(id)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(id)
    }
  }

  // Format card count text
  const cardCountText =
    cardCount === 0
      ? 'No cards'
      : cardCount === 1
        ? '1 card'
        : `${cardCount} cards`

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${name}, ${cardCountText}`}
      className={`
        relative w-full aspect-[4/5] overflow-visible
        bg-[#fdfbf7] border-[3px] border-[#2d2d2d]
        shadow-[4px_4px_0px_0px_#2d2d2d]
        hover:shadow-[2px_2px_0px_0px_#2d2d2d]
        hover:translate-x-[2px] hover:translate-y-[2px]
        active:shadow-none
        active:translate-x-[4px] active:translate-y-[4px]
        transition-all duration-100
        cursor-pointer
        text-left
        group
      `}
      style={{
        borderRadius: wobbly.lg,
      }}
    >
      {/* Corner tape decorations */}
      <CornerTape position="top-left" />
      <CornerTape position="top-right" />

      {/* Background: cover image or pattern */}
      {coverImageUrl ? (
        <div
          data-testid="cover-image"
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url(${coverImageUrl})`,
            borderRadius: 'inherit',
          }}
        />
      ) : (
        <PatternBackground />
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col p-3 pt-4">
        {/* Photo preview area */}
        <div
          data-testid="photo-preview-container"
          className="flex-1 flex items-center justify-center min-h-[60px]"
        >
          <PhotoPreviewCollage urls={previewUrls} />
        </div>

        {/* Board info */}
        <div className="mt-auto pt-2 border-t border-[#e5e0d8]">
          {/* Board name */}
          <h3
            className="text-[#2d2d2d] text-base leading-tight truncate group-hover:text-[#ff4d4d] transition-colors"
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 700,
            }}
          >
            {name}
          </h3>

          {/* Card count */}
          <p
            className="text-[#9a958d] text-sm mt-0.5"
            style={{
              fontFamily: "'Patrick Hand', cursive",
            }}
          >
            {cardCountText}
          </p>
        </div>
      </div>

      {/* Subtle inner highlight for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          borderRadius: 'inherit',
          boxShadow: 'inset 0 0 0 2px rgba(255, 77, 77, 0.1)',
        }}
      />
    </button>
  )
}
