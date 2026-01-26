/**
 * TemplateCard Component
 *
 * Displays a board template preview with name, description, item count, and category.
 * Hand-drawn aesthetic with wobbly borders.
 *
 * Used in:
 * - Template picker page
 * - Friends tab template suggestions
 */

import { type KeyboardEvent } from 'react'
import { wobbly } from '../styles/wobbly'
import type { BoardTemplate } from '../lib/socialTypes'

export interface TemplateCardProps {
  /** The template to display */
  template: BoardTemplate
  /** Click handler */
  onClick: (template: BoardTemplate) => void
}

/**
 * Category badge component
 */
const CategoryBadge = ({ category }: { category: string }) => (
  <span
    className="
      px-2 py-0.5
      bg-[#2d5da1]/10
      text-[#2d5da1]
      text-xs
      border border-[#2d5da1]/30
    "
    style={{
      borderRadius: wobbly.pill,
      fontFamily: "'Patrick Hand', cursive",
    }}
  >
    {category}
  </span>
)

/**
 * Item count indicator
 */
const ItemCount = ({ count }: { count: number }) => (
  <span
    className="
      text-[#2d2d2d]/60
      text-sm
    "
    style={{ fontFamily: "'Patrick Hand', cursive" }}
  >
    {count} item{count !== 1 ? 's' : ''}
  </span>
)

export const TemplateCard = ({ template, onClick }: TemplateCardProps) => {
  const handleClick = () => onClick(template)

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(template)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="
        w-full
        flex flex-col gap-2
        p-4
        bg-white
        border-[3px] border-[#2d2d2d]
        shadow-[4px_4px_0px_0px_#2d2d2d]
        hover:shadow-[2px_2px_0px_0px_#2d2d2d]
        hover:translate-x-[2px] hover:translate-y-[2px]
        active:shadow-none
        active:translate-x-[4px] active:translate-y-[4px]
        transition-all duration-100
        text-left
      "
      style={{ borderRadius: wobbly.md }}
    >
      {/* Header row: category badge */}
      <div className="flex items-center justify-between">
        <CategoryBadge category={template.category} />
        <ItemCount count={template.items.length} />
      </div>

      {/* Title */}
      <h3
        className="
          text-[#2d2d2d]
          text-lg
          font-semibold
          leading-tight
        "
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        {template.name}
      </h3>

      {/* Description */}
      <p
        className="
          text-[#2d2d2d]/70
          text-sm
          line-clamp-2
        "
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        {template.description}
      </p>

      {/* Preview of first few items */}
      <div className="flex flex-wrap gap-1 mt-1">
        {template.items.slice(0, 4).map((item) => (
          <span
            key={item.id}
            className="
              px-2 py-0.5
              bg-[#e5e0d8]
              text-[#2d2d2d]
              text-xs
              border border-[#2d2d2d]/20
            "
            style={{
              borderRadius: wobbly.sm,
              fontFamily: "'Patrick Hand', cursive",
            }}
          >
            {item.name}
          </span>
        ))}
        {template.items.length > 4 && (
          <span
            className="
              px-2 py-0.5
              text-[#2d2d2d]/50
              text-xs
            "
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            +{template.items.length - 4} more
          </span>
        )}
      </div>
    </button>
  )
}
