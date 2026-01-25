/**
 * localStorage Wrapper for Boards and Cards
 *
 * Provides typed JSON storage with error handling.
 * Separate keys for boards and cards for easy management.
 */

import type { Board, Card, Snapshot } from './types'
import { isBoard, isCard, isSnapshot } from './types'

const STORAGE_KEYS = {
  boards: 'singles-infernal-rank:boards',
  cards: 'singles-infernal-rank:cards',
  settings: 'singles-infernal-rank:settings',
  snapshots: 'singles-infernal-rank:snapshots',
} as const

/**
 * Settings stored in localStorage
 */
export interface AppSettings {
  soundsEnabled: boolean
  /** Show nicknames instead of real names in rank list */
  nicknameModeRankList: boolean
  /** Show nicknames instead of real names in compare view */
  nicknameModeCompareView: boolean
  /** Show nicknames instead of real names in trends chart */
  nicknameModeChart: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  soundsEnabled: false,
  nicknameModeRankList: false,
  nicknameModeCompareView: false,
  nicknameModeChart: false,
}

// ============ Boards ============

/**
 * Get all boards from localStorage
 */
export const getBoards = (): Board[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.boards)
    if (!data) return []

    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) return []

    // Filter to only valid boards
    return parsed.filter(isBoard)
  } catch {
    console.error('Failed to parse boards from localStorage')
    return []
  }
}

/**
 * Save all boards to localStorage
 */
export const saveBoards = (boards: Board[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards))
  } catch (error) {
    console.error('Failed to save boards to localStorage:', error)
    throw new Error('Failed to save boards')
  }
}

/**
 * Get a single board by ID
 */
export const getBoard = (id: string): Board | null => {
  const boards = getBoards()
  return boards.find((b) => b.id === id) ?? null
}

/**
 * Save a single board (create or update)
 */
export const saveBoard = (board: Board): void => {
  const boards = getBoards()
  const index = boards.findIndex((b) => b.id === board.id)

  if (index >= 0) {
    boards[index] = board
  } else {
    boards.push(board)
  }

  saveBoards(boards)
}

/**
 * Delete a board by ID (hard delete)
 */
export const deleteBoard = (id: string): void => {
  const boards = getBoards().filter((b) => b.id !== id)
  saveBoards(boards)
}

// ============ Cards ============

/**
 * Get all cards from localStorage
 */
export const getCards = (): Card[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.cards)
    if (!data) return []

    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isCard)
  } catch {
    console.error('Failed to parse cards from localStorage')
    return []
  }
}

/**
 * Save all cards to localStorage
 */
export const saveCards = (cards: Card[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards))
  } catch (error) {
    console.error('Failed to save cards to localStorage:', error)
    throw new Error('Failed to save cards')
  }
}

/**
 * Get cards for a specific board, sorted by rank
 */
export const getCardsByBoard = (boardId: string): Card[] => {
  return getCards()
    .filter((c) => c.boardId === boardId)
    .sort((a, b) => a.rank - b.rank)
}

/**
 * Get a single card by ID
 */
export const getCard = (id: string): Card | null => {
  const cards = getCards()
  return cards.find((c) => c.id === id) ?? null
}

/**
 * Save a single card (create or update)
 */
export const saveCard = (card: Card): void => {
  const cards = getCards()
  const index = cards.findIndex((c) => c.id === card.id)

  if (index >= 0) {
    cards[index] = card
  } else {
    cards.push(card)
  }

  saveCards(cards)
}

/**
 * Delete a card by ID
 */
export const deleteCard = (id: string): void => {
  const cards = getCards().filter((c) => c.id !== id)
  saveCards(cards)
}

/**
 * Delete all cards for a board
 */
export const deleteCardsByBoard = (boardId: string): void => {
  const cards = getCards().filter((c) => c.boardId !== boardId)
  saveCards(cards)
}

/**
 * Save cards for a specific board (preserves cards from other boards)
 */
export const saveCardsForBoard = (boardId: string, boardCards: Card[]): void => {
  // Get all cards, remove cards for this board, then add the new ones
  const otherCards = getCards().filter((c) => c.boardId !== boardId)
  saveCards([...otherCards, ...boardCards])
}

// ============ Settings ============

/**
 * Get app settings from localStorage
 */
export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.settings)
    if (!data) return DEFAULT_SETTINGS

    const parsed = JSON.parse(data)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * Save app settings to localStorage
 */
export const saveSettings = (settings: Partial<AppSettings>): void => {
  const current = getSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updated))
}

// ============ Snapshots ============

/**
 * Get all snapshots from localStorage
 */
export const getSnapshots = (): Snapshot[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.snapshots)
    if (!data) return []

    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isSnapshot)
  } catch {
    console.error('Failed to parse snapshots from localStorage')
    return []
  }
}

/**
 * Save all snapshots to localStorage
 */
export const saveSnapshots = (snapshots: Snapshot[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.snapshots, JSON.stringify(snapshots))
  } catch (error) {
    console.error('Failed to save snapshots to localStorage:', error)
    throw new Error('Failed to save snapshots')
  }
}

/**
 * Get snapshots for a specific board, sorted by episode number
 */
export const getSnapshotsByBoard = (boardId: string): Snapshot[] => {
  return getSnapshots()
    .filter((s) => s.boardId === boardId)
    .sort((a, b) => a.episodeNumber - b.episodeNumber)
}

/**
 * Get a single snapshot by ID
 */
export const getSnapshot = (id: string): Snapshot | null => {
  const snapshots = getSnapshots()
  return snapshots.find((s) => s.id === id) ?? null
}

/**
 * Save a single snapshot (create or update)
 */
export const saveSnapshot = (snapshot: Snapshot): void => {
  const snapshots = getSnapshots()
  const index = snapshots.findIndex((s) => s.id === snapshot.id)

  if (index >= 0) {
    snapshots[index] = snapshot
  } else {
    snapshots.push(snapshot)
  }

  saveSnapshots(snapshots)
}

/**
 * Delete a snapshot by ID
 */
export const deleteSnapshot = (id: string): void => {
  const snapshots = getSnapshots().filter((s) => s.id !== id)
  saveSnapshots(snapshots)
}

/**
 * Delete all snapshots for a board
 */
export const deleteSnapshotsByBoard = (boardId: string): void => {
  const snapshots = getSnapshots().filter((s) => s.boardId !== boardId)
  saveSnapshots(snapshots)
}

/**
 * Get the next suggested episode number for a board
 */
export const getNextEpisodeNumber = (boardId: string): number => {
  const boardSnapshots = getSnapshotsByBoard(boardId)
  if (boardSnapshots.length === 0) return 1
  return Math.max(...boardSnapshots.map((s) => s.episodeNumber)) + 1
}

// ============ Utilities ============

/**
 * Clear all app data from localStorage
 */
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.boards)
  localStorage.removeItem(STORAGE_KEYS.cards)
  localStorage.removeItem(STORAGE_KEYS.settings)
  localStorage.removeItem(STORAGE_KEYS.snapshots)
}

/**
 * Export all data as JSON string
 */
export const exportData = (): string => {
  return JSON.stringify({
    version: '1.1',
    boards: getBoards(),
    cards: getCards(),
    snapshots: getSnapshots(),
    settings: getSettings(),
    exportedAt: Date.now(),
  }, null, 2)
}

// ============ Import ============

/**
 * Import data format
 */
export interface ImportData {
  version: string
  boards: Board[]
  cards: Card[]
  snapshots?: Snapshot[]
  settings?: AppSettings
  exportedAt?: number
}

/**
 * Validation result for import data
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean
  error?: string
  boardsImported?: number
  cardsImported?: number
  snapshotsImported?: number
}

/**
 * Validate import data structure
 */
export const validateImportData = (data: unknown): ValidationResult => {
  const errors: string[] = []

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be an object'] }
  }

  const obj = data as Record<string, unknown>

  // Check version
  if (typeof obj.version !== 'string') {
    errors.push('Missing or invalid version field')
  }

  // Check boards array
  if (!Array.isArray(obj.boards)) {
    errors.push('boards must be an array')
  }

  // Check cards array
  if (!Array.isArray(obj.cards)) {
    errors.push('cards must be an array')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Import options
 */
export interface ImportOptions {
  merge?: boolean // If true, merge with existing data. If false, replace.
}

/**
 * Import data from JSON string
 */
export const importData = (
  jsonString: string,
  options: ImportOptions = { merge: true }
): ImportResult => {
  // Parse JSON
  let data: unknown
  try {
    data = JSON.parse(jsonString)
  } catch {
    return { success: false, error: 'Invalid JSON format' }
  }

  // Validate structure
  const validation = validateImportData(data)
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') }
  }

  const importedData = data as ImportData

  // Filter to only valid data
  const validBoards = importedData.boards.filter(isBoard)
  const validCards = importedData.cards.filter(isCard)
  const validSnapshots = (importedData.snapshots ?? []).filter(isSnapshot)

  if (!options.merge) {
    // Replace mode: clear existing data first
    saveBoards([])
    saveCards([])
    saveSnapshots([])
  }

  // Get existing data for merge
  const existingBoards = options.merge ? getBoards() : []
  const existingCards = options.merge ? getCards() : []
  const existingSnapshots = options.merge ? getSnapshots() : []

  // Merge boards (skip duplicates by ID)
  const existingBoardIds = new Set(existingBoards.map((b) => b.id))
  const newBoards = validBoards.filter((b) => !existingBoardIds.has(b.id))
  saveBoards([...existingBoards, ...newBoards])

  // Merge cards (skip duplicates by ID)
  const existingCardIds = new Set(existingCards.map((c) => c.id))
  const newCards = validCards.filter((c) => !existingCardIds.has(c.id))
  saveCards([...existingCards, ...newCards])

  // Merge snapshots (skip duplicates by ID)
  const existingSnapshotIds = new Set(existingSnapshots.map((s) => s.id))
  const newSnapshots = validSnapshots.filter((s) => !existingSnapshotIds.has(s.id))
  saveSnapshots([...existingSnapshots, ...newSnapshots])

  return {
    success: true,
    boardsImported: newBoards.length,
    cardsImported: newCards.length,
    snapshotsImported: newSnapshots.length,
  }
}
