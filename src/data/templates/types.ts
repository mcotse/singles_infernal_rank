/**
 * Template System Types
 *
 * Types for bundled board templates that can be loaded instantly.
 */

/**
 * A single item within a template (becomes a Card)
 */
export interface BundledTemplateItem {
  /** Unique identifier within the template */
  id: string
  /** Display name for the item */
  name: string
  /** Optional nickname */
  nickname?: string
  /** Optional notes about the item */
  notes?: string
  /** Extensible metadata */
  metadata?: Record<string, unknown>
}

/**
 * A bundled template that can be loaded to create a board
 */
export interface BundledTemplate {
  /** Unique identifier for the template */
  id: string
  /** Display name shown in the picker */
  name: string
  /** Brief description of the template */
  description: string
  /** Category for grouping (e.g., "Reality TV", "Sports") */
  category: string
  /** Optional placeholder text for cover image generation */
  coverImagePlaceholder?: string
  /** Items that will become cards */
  items: BundledTemplateItem[]
}

/**
 * Result from loading a template
 */
export interface TemplateLoadResult {
  /** Whether the load was successful */
  success: boolean
  /** ID of the created board (if successful) */
  boardId?: string
  /** Number of cards created */
  cardsCreated: number
  /** Number of images created */
  imagesCreated: number
  /** Any errors that occurred */
  errors: string[]
}

/**
 * Progress info during template loading
 */
export interface TemplateLoadProgress {
  /** Current step number */
  current: number
  /** Total steps */
  total: number
  /** Human-readable description of current step */
  name: string
}
