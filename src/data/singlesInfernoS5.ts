/**
 * Singles Inferno Season 5 Cast Seed Data
 *
 * This file contains the cast members from Netflix's Singles Inferno Season 5.
 * Use this as seed data to quickly populate a ranking board.
 */

import type { Board, Card } from '../lib/types'
import { saveBoard, saveCard, getBoard } from '../lib/storage'
import { saveImage } from '../lib/db'
import { processImage } from '../lib/imageUtils'

const BOARD_ID = 'singles-inferno-s5-seed'

/**
 * Singles Inferno S5 poster image URL
 */
const POSTER_URL = 'https://www.allkpop.com/upload/2026/01/content/061028/1767713284-jyzbnb2rexelgnvuv7sqlu1zjaf7hovkuz5kn7q1g0p2nshm9rkccwiwowdacgbu2zlu53crwanfuggfbc0ruw.jpg'

/**
 * Cast member data with image URLs
 */
interface CastMember {
  id: string
  name: string
  notes: string
  gender: 'female' | 'male'
  imageUrl: string
}

const castMembers: CastMember[] = [
  // Female Cast Members
  {
    id: 'si5-park-hee-sun',
    name: 'Park Hee Sun',
    notes: 'Female contestant',
    gender: 'female',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Park-Hee-sun-1024x599.jpg',
  },
  {
    id: 'si5-kim-go-eun',
    name: 'Kim Go Eun',
    notes: 'Female contestant',
    gender: 'female',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Kim-Go-eun-1024x603.jpg',
  },
  {
    id: 'si5-ham-ye-jin',
    name: 'Ham Ye Jin',
    notes: 'Female contestant',
    gender: 'female',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Ham-Ye-jin-1024x598.jpg',
  },
  {
    id: 'si5-kim-min-ji',
    name: 'Kim Min Ji',
    notes: 'Female contestant',
    gender: 'female',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Kim-Min-ji-1024x598.jpg',
  },
  {
    id: 'si5-lee-joo-young',
    name: 'Lee Joo Young',
    notes: 'Female contestant',
    gender: 'female',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Lee-Joo-young-1024x592.jpg',
  },
  {
    id: 'si5-choi-mina-sue',
    name: 'Choi Mina Sue',
    notes: 'Female contestant',
    gender: 'female',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Choi-Mina-Sue-1024x605.jpg',
  },
  // Male Cast Members
  {
    id: 'si5-youn-hyun-jae',
    name: 'Youn Hyun Jae',
    notes: 'Male contestant',
    gender: 'male',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Youn-Hyun-jae-1024x598.jpg',
  },
  {
    id: 'si5-song-seung-il',
    name: 'Song Seung Il',
    notes: 'Male contestant',
    gender: 'male',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Song-Seung-il-1024x598.jpg',
  },
  {
    id: 'si5-shin-hyeon-woo',
    name: 'Shin Hyeon Woo',
    notes: 'Male contestant',
    gender: 'male',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Shin-Hyeon–woo-1024x598.jpg',
  },
  {
    id: 'si5-kim-jae-jin',
    name: 'Kim Jae Jin',
    notes: 'Male contestant',
    gender: 'male',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Kim-Jae-jin--1024x607.jpg',
  },
  {
    id: 'si5-woo-sung-min',
    name: 'Woo Sung Min',
    notes: 'Male contestant',
    gender: 'male',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Woo-Sung-min-1024x598.jpg',
  },
  {
    id: 'si5-lim-su-been',
    name: 'Lim Su Been',
    notes: 'Male contestant',
    gender: 'male',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Lim-Su-been-1024x600.jpg',
  },
  {
    id: 'si5-lee-sung-hun',
    name: 'Lee Sung Hun (Samuel Lee)',
    notes: 'Male contestant',
    gender: 'male',
    imageUrl: 'https://www.dexerto.com/cdn-image/wp-content/uploads/2026/01/19/Lee-Sung-hun-1024x598.jpg',
  },
]

/**
 * Fetch an image from URL and return as Blob
 * Uses a CORS proxy to bypass cross-origin restrictions
 */
const fetchImageAsBlob = async (url: string): Promise<Blob> => {
  // Try multiple CORS proxies in case one fails
  const corsProxies = [
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  ]

  let lastError: Error | null = null

  for (const proxyFn of corsProxies) {
    try {
      const proxyUrl = proxyFn(url)
      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      return response.blob()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      // Try next proxy
    }
  }

  throw lastError || new Error('All CORS proxies failed')
}

/**
 * Load progress callback type
 */
export type LoadProgressCallback = (current: number, total: number, name: string) => void

/**
 * Load result
 */
export interface LoadSeedDataResult {
  success: boolean
  boardCreated: boolean
  cardsCreated: number
  imagesLoaded: number
  errors: string[]
}

/**
 * Load Singles Inferno Season 5 seed data with images
 *
 * This function:
 * 1. Creates the board with poster as cover image
 * 2. Creates all cast member cards
 * 3. Fetches and processes images for each cast member
 * 4. Reports progress via callback
 */
export const loadSinglesInfernoS5 = async (
  onProgress?: LoadProgressCallback
): Promise<LoadSeedDataResult> => {
  const now = Date.now()
  const errors: string[] = []
  let imagesLoaded = 0
  let cardsCreated = 0
  let boardCreated = false

  const totalSteps = castMembers.length + 1 // +1 for board/poster

  // Check if board already exists
  const existingBoard = getBoard(BOARD_ID)
  if (existingBoard) {
    return {
      success: true,
      boardCreated: false,
      cardsCreated: 0,
      imagesLoaded: 0,
      errors: ['Singles Inferno S5 board already exists'],
    }
  }

  // Step 1: Create board and fetch poster image
  onProgress?.(0, totalSteps, 'Loading poster...')

  let coverImageKey: string | null = null
  try {
    const posterBlob = await fetchImageAsBlob(POSTER_URL)
    const processed = await processImage(posterBlob)

    coverImageKey = `poster-${BOARD_ID}`
    await saveImage({
      key: coverImageKey,
      blob: processed.fullBlob,
      thumbnail: processed.thumbnailBlob,
      mimeType: processed.mimeType,
      createdAt: now,
    })
    imagesLoaded++
  } catch (error) {
    errors.push(`Failed to load poster: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Create board
  const board: Board = {
    id: BOARD_ID,
    name: 'Singles Inferno S5',
    coverImage: coverImageKey,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  saveBoard(board)
  boardCreated = true

  // Step 2: Create cards and fetch images for each cast member
  for (let i = 0; i < castMembers.length; i++) {
    const member = castMembers[i]
    onProgress?.(i + 1, totalSteps, `Loading ${member.name}...`)

    let imageKey: string | null = null

    // Fetch and process image
    try {
      const imageBlob = await fetchImageAsBlob(member.imageUrl)
      const processed = await processImage(imageBlob)

      imageKey = `image-${member.id}`

      await saveImage({
        key: imageKey,
        blob: processed.fullBlob,
        thumbnail: processed.thumbnailBlob,
        mimeType: processed.mimeType,
        createdAt: now,
      })
      imagesLoaded++
    } catch (error) {
      errors.push(`Failed to load image for ${member.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Create card
    const card: Card = {
      id: member.id,
      boardId: BOARD_ID,
      name: member.name,
      imageKey,
      thumbnailKey: imageKey, // Use same key, db stores both
      imageCrop: null,
      notes: member.notes,
      metadata: { gender: member.gender, season: 5 },
      rank: i + 1,
      createdAt: now,
      updatedAt: now,
    }
    saveCard(card)
    cardsCreated++
  }

  onProgress?.(totalSteps, totalSteps, 'Complete!')

  return {
    success: true,
    boardCreated,
    cardsCreated,
    imagesLoaded,
    errors,
  }
}

/**
 * Get the seed data as a JSON string for import (without images)
 * @deprecated Use loadSinglesInfernoS5() instead for full functionality with images
 */
export const getSinglesInfernoS5Json = (): string => {
  const now = Date.now()
  return JSON.stringify({
    version: '1.0',
    boards: [{
      id: BOARD_ID,
      name: 'Singles Inferno S5',
      coverImage: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }],
    cards: castMembers.map((member, index) => ({
      id: member.id,
      boardId: BOARD_ID,
      name: member.name,
      imageKey: null,
      thumbnailKey: null,
      imageCrop: null,
      notes: member.notes,
      metadata: { gender: member.gender, season: 5 },
      rank: index + 1,
      createdAt: now,
      updatedAt: now,
    })),
    exportedAt: now,
  }, null, 2)
}
