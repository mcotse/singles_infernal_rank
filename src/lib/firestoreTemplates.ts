/**
 * Firestore Template Service
 *
 * Provides CRUD operations for board templates in Firestore.
 * Templates are admin-curated board structures that users can use
 * as starting points for their own boards.
 *
 * Templates enable:
 * - Automatic comparison matching between users
 * - Standardized item sets (e.g., "Singles Inferno S5 Cast")
 * - Locked names/items for consistent comparison
 */

import type { BoardTemplate, TemplateItem } from './socialTypes'
import { isBoardTemplate } from './socialTypes'
import { getFirebaseDb, USE_MOCK_AUTH } from './firebase'
import { createMockTimestamp } from './mockAuth'

// ============ Mock Data for Development ============

/**
 * Mock templates for development mode
 * These simulate what would be stored in Firestore
 */
const MOCK_TEMPLATES: BoardTemplate[] = [
  {
    id: 'singles-inferno-s5',
    name: 'Singles Inferno Season 5',
    description: 'Rank the contestants from Singles Inferno Season 5',
    category: 'Reality TV',
    items: [
      { id: 'si5-1', name: 'Contestant 1' },
      { id: 'si5-2', name: 'Contestant 2' },
      { id: 'si5-3', name: 'Contestant 3' },
      { id: 'si5-4', name: 'Contestant 4' },
      { id: 'si5-5', name: 'Contestant 5' },
      { id: 'si5-6', name: 'Contestant 6' },
      { id: 'si5-7', name: 'Contestant 7' },
      { id: 'si5-8', name: 'Contestant 8' },
    ],
    isActive: true,
    createdAt: createMockTimestamp(Date.now()),
  },
  {
    id: 'singles-inferno-s4',
    name: 'Singles Inferno Season 4',
    description: 'Rank the contestants from Singles Inferno Season 4',
    category: 'Reality TV',
    items: [
      { id: 'si4-1', name: 'Lee Si-an' },
      { id: 'si4-2', name: 'Park Ji-yeon' },
      { id: 'si4-3', name: 'Kim Se-jun' },
      { id: 'si4-4', name: 'Yu Si-eun' },
      { id: 'si4-5', name: 'Lee Gwan-hee' },
      { id: 'si4-6', name: 'Bae Ji-yeon' },
    ],
    isActive: true,
    createdAt: createMockTimestamp(Date.now()),
  },
  {
    id: 'physical-100-s3',
    name: 'Physical: 100 Season 3',
    description: 'Rank your favorite competitors from Physical: 100 S3',
    category: 'Reality TV',
    items: [
      { id: 'p100-1', name: 'Competitor 1' },
      { id: 'p100-2', name: 'Competitor 2' },
      { id: 'p100-3', name: 'Competitor 3' },
      { id: 'p100-4', name: 'Competitor 4' },
    ],
    isActive: true,
    createdAt: createMockTimestamp(Date.now()),
  },
]

// ============ Firestore CRUD Operations ============

/**
 * Get all active templates from Firestore
 * Returns only templates where isActive is true
 */
export const getActiveTemplates = async (): Promise<BoardTemplate[]> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, return mock templates
    return MOCK_TEMPLATES.filter((t) => t.isActive)
  }

  const db = await getFirebaseDb()
  const { collection, query, where, getDocs } = await import(
    'firebase/firestore'
  )

  const q = query(
    collection(db, 'templates'),
    where('isActive', '==', true)
  )
  const snapshot = await getDocs(q)

  const templates: BoardTemplate[] = []
  snapshot.forEach((doc) => {
    const data = doc.data()
    if (isBoardTemplate(data)) {
      templates.push(data)
    }
  })

  return templates.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get a single template by ID
 */
export const getTemplateById = async (
  templateId: string
): Promise<BoardTemplate | null> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, find in mock templates
    return MOCK_TEMPLATES.find((t) => t.id === templateId) ?? null
  }

  const db = await getFirebaseDb()
  const { doc, getDoc } = await import('firebase/firestore')

  const docSnap = await getDoc(doc(db, 'templates', templateId))
  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return isBoardTemplate(data) ? data : null
}

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (
  category: string
): Promise<BoardTemplate[]> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, filter mock templates
    return MOCK_TEMPLATES.filter(
      (t) => t.isActive && t.category.toLowerCase() === category.toLowerCase()
    )
  }

  const db = await getFirebaseDb()
  const { collection, query, where, getDocs } = await import(
    'firebase/firestore'
  )

  const q = query(
    collection(db, 'templates'),
    where('isActive', '==', true),
    where('category', '==', category)
  )
  const snapshot = await getDocs(q)

  const templates: BoardTemplate[] = []
  snapshot.forEach((doc) => {
    const data = doc.data()
    if (isBoardTemplate(data)) {
      templates.push(data)
    }
  })

  return templates.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get all unique categories from templates
 */
export const getTemplateCategories = async (): Promise<string[]> => {
  const templates = await getActiveTemplates()
  const categories = new Set(templates.map((t) => t.category))
  return Array.from(categories).sort()
}

// ============ Board Creation from Template ============

/**
 * UserRankedItem - A user's ranked version of a template item
 * Per spec: users can customize nicknames, notes, photos but not the item name
 */
export interface UserRankedItem {
  templateItemId: string // Links to TemplateItem.id
  rank: number
  nickname?: string // User's custom nickname
  notes?: string // User's notes
  customImageUrl?: string // User-uploaded image (overrides default)
}

/**
 * BoardFromTemplate - Data needed to create a board from a template
 */
export interface BoardFromTemplateInput {
  templateId: string
  name?: string // Optional override, defaults to template name
}

/**
 * Create initial ranked items from a template
 * Items are assigned sequential ranks based on template order
 */
export const createRankedItemsFromTemplate = (
  template: BoardTemplate
): UserRankedItem[] => {
  return template.items.map((item, index) => ({
    templateItemId: item.id,
    rank: index + 1,
    // nickname, notes, customImageUrl start as undefined
  }))
}

/**
 * Get the display name for a ranked item
 * Returns nickname if set, otherwise the original template item name
 */
export const getRankedItemDisplayName = (
  rankedItem: UserRankedItem,
  templateItem: TemplateItem
): string => {
  return rankedItem.nickname ?? templateItem.name
}

/**
 * Get the image URL for a ranked item
 * Returns customImageUrl if set, otherwise the template default image
 */
export const getRankedItemImageUrl = (
  rankedItem: UserRankedItem,
  templateItem: TemplateItem
): string | undefined => {
  return rankedItem.customImageUrl ?? templateItem.defaultImageUrl
}

// ============ Template Matching ============

/**
 * Check if two boards are based on the same template
 * Used for automatic comparison matching
 */
export const areTemplateMatching = (
  templateId1?: string,
  templateId2?: string
): boolean => {
  if (!templateId1 || !templateId2) {
    return false
  }
  return templateId1 === templateId2
}

/**
 * Check if two board titles match (for custom boards)
 * Case-insensitive comparison per spec
 */
export const areTitlesMatching = (title1: string, title2: string): boolean => {
  return title1.toLowerCase().trim() === title2.toLowerCase().trim()
}

// ============ Board Creation from Template ============

import { createBoard as createBoardEntity, createCard, type Board, type Card } from './types'
import { saveBoard, saveCardsForBoard } from './storage'

/**
 * Result of creating a board from a template
 */
export interface CreateBoardFromTemplateResult {
  board: Board
  cards: Card[]
}

/**
 * Create a new board with pre-populated cards from a template
 * This creates both the board and cards, saving them to storage
 *
 * @param template - The template to create from
 * @param customName - Optional custom name (defaults to template name)
 * @returns The created board and cards
 */
export const createBoardFromTemplate = (
  template: BoardTemplate,
  customName?: string
): CreateBoardFromTemplateResult => {
  // Create the board with template reference
  const board = createBoardEntity(
    customName ?? template.name,
    null, // no cover image initially
    template.id // templateId
  )

  // Save the board
  saveBoard(board)

  // Create cards from template items
  const cards: Card[] = template.items.map((item, index) =>
    createCard(board.id, item.name, index + 1, {
      // Store templateItemId in metadata for comparison matching
      metadata: { templateItemId: item.id },
    })
  )

  // Save all cards
  saveCardsForBoard(board.id, cards)

  return { board, cards }
}
