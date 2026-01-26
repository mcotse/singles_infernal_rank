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
  templateId?: string     // Optional: links to BoardTemplate for comparison matching
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
  nickname: string        // Optional nickname (displayed when nickname mode is on)
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
export const createBoard = (
  name: string,
  coverImage: string | null = null,
  templateId?: string
): Board => ({
  id: crypto.randomUUID(),
  name,
  coverImage,
  ...(templateId && { templateId }),
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
  options: Partial<Pick<Card, 'imageKey' | 'thumbnailKey' | 'imageCrop' | 'notes' | 'nickname' | 'metadata'>> = {}
): Card => ({
  id: crypto.randomUUID(),
  boardId,
  name,
  nickname: options.nickname ?? '',
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

// ============ Snapshots (Episode History) ============

/**
 * RankingEntry - A single card's rank at a point in time
 * Denormalized to preserve history even if cards are deleted
 */
export interface RankingEntry {
  cardId: string
  cardName: string
  cardNickname?: string   // Optional nickname at time of snapshot
  rank: number
  thumbnailKey: string | null
}

/**
 * Snapshot - A saved point-in-time capture of rankings
 */
export interface Snapshot {
  id: string
  boardId: string
  episodeNumber: number
  label: string
  notes: string
  rankings: RankingEntry[]
  createdAt: number
}

/**
 * Create a new Snapshot with defaults
 */
export const createSnapshot = (
  boardId: string,
  episodeNumber: number,
  rankings: RankingEntry[],
  options: Partial<Pick<Snapshot, 'label' | 'notes'>> = {}
): Snapshot => ({
  id: crypto.randomUUID(),
  boardId,
  episodeNumber,
  label: options.label ?? `Episode ${episodeNumber}`,
  notes: options.notes ?? '',
  rankings,
  createdAt: Date.now(),
})

/**
 * Type guard for RankingEntry
 */
export const isRankingEntry = (obj: unknown): obj is RankingEntry => {
  if (typeof obj !== 'object' || obj === null) return false
  const r = obj as Record<string, unknown>
  return (
    typeof r.cardId === 'string' &&
    typeof r.cardName === 'string' &&
    typeof r.rank === 'number'
  )
}

/**
 * Type guard for Snapshot
 */
export const isSnapshot = (obj: unknown): obj is Snapshot => {
  if (typeof obj !== 'object' || obj === null) return false
  const s = obj as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    typeof s.boardId === 'string' &&
    typeof s.episodeNumber === 'number' &&
    typeof s.label === 'string' &&
    Array.isArray(s.rankings) &&
    typeof s.createdAt === 'number'
  )
}
