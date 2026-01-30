/**
 * useTemplateLoader Hook
 *
 * Loads bundled templates to create boards with cards and placeholder avatars.
 * All operations are instant (canvas-based avatar generation, no network).
 */

import { useState, useCallback } from 'react'
import type { BundledTemplate, TemplateLoadResult, TemplateLoadProgress } from '../data/templates'
import { createBoard, createCard } from '../lib/types'
import { saveBoard, saveCard } from '../lib/storage'
import { saveImage } from '../lib/db'
import { generatePlaceholderAvatar } from '../lib/avatarUtils'

export interface UseTemplateLoaderReturn {
  /** Whether a template is currently being loaded */
  isLoading: boolean
  /** Current progress info (null if not loading) */
  progress: TemplateLoadProgress | null
  /** Load a template and create a board with cards */
  loadTemplate: (template: BundledTemplate) => Promise<TemplateLoadResult>
}

/**
 * Hook for loading bundled templates
 */
export const useTemplateLoader = (): UseTemplateLoaderReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<TemplateLoadProgress | null>(null)

  const loadTemplate = useCallback(async (template: BundledTemplate): Promise<TemplateLoadResult> => {
    setIsLoading(true)
    setProgress({ current: 0, total: template.items.length + 1, name: 'Creating board...' })

    const errors: string[] = []
    let imagesCreated = 0
    let cardsCreated = 0
    const now = Date.now()

    try {
      // Step 1: Create the board with optional cover image
      let coverImageKey: string | null = null

      if (template.coverImagePlaceholder) {
        try {
          coverImageKey = `cover-${template.id}-${now}`
          const coverFull = await generatePlaceholderAvatar(template.coverImagePlaceholder, 400)
          const coverThumb = await generatePlaceholderAvatar(template.coverImagePlaceholder, 200)

          await saveImage({
            key: coverImageKey,
            blob: coverFull,
            thumbnail: coverThumb,
            mimeType: 'image/jpeg',
            createdAt: now,
          })
          imagesCreated++
        } catch (error) {
          errors.push(`Failed to create cover image: ${error instanceof Error ? error.message : 'Unknown error'}`)
          coverImageKey = null
        }
      }

      const board = createBoard(template.name, coverImageKey, template.id)
      saveBoard(board)

      // Step 2: Create cards with placeholder avatars
      for (let i = 0; i < template.items.length; i++) {
        const item = template.items[i]
        setProgress({
          current: i + 1,
          total: template.items.length + 1,
          name: `Creating ${item.name}...`,
        })

        let imageKey: string | null = null

        try {
          imageKey = `image-${item.id}-${now}`
          const fullBlob = await generatePlaceholderAvatar(item.name, 400)
          const thumbnailBlob = await generatePlaceholderAvatar(item.name, 200)

          await saveImage({
            key: imageKey,
            blob: fullBlob,
            thumbnail: thumbnailBlob,
            mimeType: 'image/jpeg',
            createdAt: now,
          })
          imagesCreated++
        } catch (error) {
          errors.push(`Failed to create image for ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          imageKey = null
        }

        const card = createCard(board.id, item.name, i + 1, {
          imageKey,
          thumbnailKey: imageKey,
          nickname: item.nickname ?? '',
          notes: item.notes ?? '',
          metadata: item.metadata ?? {},
        })
        saveCard(card)
        cardsCreated++
      }

      setProgress({
        current: template.items.length + 1,
        total: template.items.length + 1,
        name: 'Complete!',
      })

      return {
        success: true,
        boardId: board.id,
        cardsCreated,
        imagesCreated,
        errors,
      }
    } catch (error) {
      return {
        success: false,
        cardsCreated,
        imagesCreated,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
      }
    } finally {
      setIsLoading(false)
      setProgress(null)
    }
  }, [])

  return {
    isLoading,
    progress,
    loadTemplate,
  }
}
