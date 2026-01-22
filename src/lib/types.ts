/**
 * Data Model Types
 *
 * Designed for future cloud sync capability:
 * - UUIDs for all IDs
 * - Timestamps for created/updated
 * - Soft delete support
 */

/**
 * Board - A collection of ranked cards
 */
export interface Board {
  id: string              // UUID
  name: string
  coverImage: string | null // IndexedDB key or null
  createdAt: number       // Unix timestamp (ms)
  updatedAt: number       // Unix timestamp (ms)
  deletedAt: number | null // Soft delete for trash (7-day recovery)
}

/**
 * Image crop data for pinch-to-zoom positioning
 */
export interface ImageCrop {
  x: number      // Pan offset X (0-1)
  y: number      // Pan offset Y (0-1)
  scale: number  // Zoom level (1 = fit, 2 = 2x zoom)
}

/**
 * Card - A single item in a ranking board
 */
export interface Card {
  id: string              // UUID
  boardId: string         // Foreign key to board
  name: string
  imageKey: string | null // IndexedDB key for full image
  thumbnailKey: string | null // IndexedDB key for thumbnail
  imageCrop: ImageCrop | null
  notes: string           // User's custom notes
  metadata: Record<string, unknown> // Extensible for future fields
  rank: number            // Position in list (1-indexed)
  createdAt: number       // Unix timestamp (ms)
  updatedAt: number       // Unix timestamp (ms)
}

/**
 * StoredImage - Image blob stored in IndexedDB
 */
export interface StoredImage {
  key: string             // UUID
  blob: Blob              // Full resolution image
  thumbnail: Blob         // Compressed thumbnail (~50KB)
  mimeType: string
  createdAt: number       // Unix timestamp (ms)
}

/**
 * Create a new Board with defaults
 */
export const createBoard = (name: string, coverImage: string | null = null): Board => ({
  id: crypto.randomUUID(),
  name,
  coverImage,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
})

/**
 * Create a new Card with defaults
 */
export const createCard = (
  boardId: string,
  name: string,
  rank: number,
  options: Partial<Pick<Card, 'imageKey' | 'thumbnailKey' | 'imageCrop' | 'notes' | 'metadata'>> = {}
): Card => ({
  id: crypto.randomUUID(),
  boardId,
  name,
  imageKey: options.imageKey ?? null,
  thumbnailKey: options.thumbnailKey ?? null,
  imageCrop: options.imageCrop ?? null,
  notes: options.notes ?? '',
  metadata: options.metadata ?? {},
  rank,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

/**
 * Type guard for Board
 */
export const isBoard = (obj: unknown): obj is Board => {
  if (typeof obj !== 'object' || obj === null) return false
  const b = obj as Record<string, unknown>
  return (
    typeof b.id === 'string' &&
    typeof b.name === 'string' &&
    typeof b.createdAt === 'number' &&
    typeof b.updatedAt === 'number'
  )
}

/**
 * Type guard for Card
 */
export const isCard = (obj: unknown): obj is Card => {
  if (typeof obj !== 'object' || obj === null) return false
  const c = obj as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    typeof c.boardId === 'string' &&
    typeof c.name === 'string' &&
    typeof c.rank === 'number' &&
    typeof c.createdAt === 'number' &&
    typeof c.updatedAt === 'number'
  )
}
