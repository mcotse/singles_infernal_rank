/**
 * localStorage Wrapper for Boards and Cards
 *
 * Provides typed JSON storage with error handling.
 * Separate keys for boards and cards for easy management.
 */

import type { Board, Card } from './types'
import { isBoard, isCard } from './types'

const STORAGE_KEYS = {
  boards: 'singles-infernal-rank:boards',
  cards: 'singles-infernal-rank:cards',
  settings: 'singles-infernal-rank:settings',
} as const

/**
 * Settings stored in localStorage
 */
export interface AppSettings {
  soundsEnabled: boolean
  // Add more settings as needed
}

const DEFAULT_SETTINGS: AppSettings = {
  soundsEnabled: false,
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

// ============ Utilities ============

/**
 * Clear all app data from localStorage
 */
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.boards)
  localStorage.removeItem(STORAGE_KEYS.cards)
  localStorage.removeItem(STORAGE_KEYS.settings)
}

/**
 * Export all data as JSON string
 */
export const exportData = (): string => {
  return JSON.stringify({
    boards: getBoards(),
    cards: getCards(),
    settings: getSettings(),
    exportedAt: Date.now(),
  }, null, 2)
}
