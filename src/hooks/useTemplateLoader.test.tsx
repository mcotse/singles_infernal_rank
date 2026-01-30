import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTemplateLoader } from './useTemplateLoader'
import * as storageModule from '../lib/storage'
import * as dbModule from '../lib/db'
import * as avatarUtilsModule from '../lib/avatarUtils'
import type { BundledTemplate } from '../data/templates'

// Mock the dependencies
vi.mock('../lib/storage', () => ({
  saveBoard: vi.fn(),
  saveCard: vi.fn(),
}))

vi.mock('../lib/db', () => ({
  saveImage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../lib/avatarUtils', () => ({
  generatePlaceholderAvatar: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
}))

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn().mockReturnValue('test-uuid-123')
vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

describe('useTemplateLoader', () => {
  const mockSaveBoard = vi.mocked(storageModule.saveBoard)
  const mockSaveCard = vi.mocked(storageModule.saveCard)
  const mockSaveImage = vi.mocked(dbModule.saveImage)
  const mockGeneratePlaceholderAvatar = vi.mocked(avatarUtilsModule.generatePlaceholderAvatar)

  const testTemplate: BundledTemplate = {
    id: 'test-template',
    name: 'Test Template',
    description: 'A test template',
    category: 'Testing',
    coverImagePlaceholder: 'Test Cover',
    items: [
      { id: 'item-1', name: 'Item One', notes: 'Notes 1', metadata: { type: 'test' } },
      { id: 'item-2', name: 'Item Two', nickname: 'Two', notes: '' },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGeneratePlaceholderAvatar.mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' }))
    mockSaveImage.mockResolvedValue(undefined)
  })

  describe('initial state', () => {
    it('starts with isLoading false', () => {
      const { result } = renderHook(() => useTemplateLoader())
      expect(result.current.isLoading).toBe(false)
    })

    it('starts with progress null', () => {
      const { result } = renderHook(() => useTemplateLoader())
      expect(result.current.progress).toBeNull()
    })
  })

  describe('loadTemplate', () => {
    // Note: Testing isLoading during async operations is unreliable due to
    // timing issues with React state batching. We test the final state instead.

    it('sets isLoading to false after loading completes', async () => {
      const { result } = renderHook(() => useTemplateLoader())

      await act(async () => {
        await result.current.loadTemplate(testTemplate)
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('sets progress to null after loading completes', async () => {
      const { result } = renderHook(() => useTemplateLoader())

      await act(async () => {
        await result.current.loadTemplate(testTemplate)
      })

      expect(result.current.progress).toBeNull()
    })

    it('creates a board with the template name', async () => {
      const { result } = renderHook(() => useTemplateLoader())

      await act(async () => {
        await result.current.loadTemplate(testTemplate)
      })

      expect(mockSaveBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Template',
          templateId: 'test-template',
        })
      )
    })

    it('creates cards for each template item', async () => {
      const { result } = renderHook(() => useTemplateLoader())

      await act(async () => {
        await result.current.loadTemplate(testTemplate)
      })

      expect(mockSaveCard).toHaveBeenCalledTimes(2)
      expect(mockSaveCard).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Item One',
          rank: 1,
          notes: 'Notes 1',
          metadata: { type: 'test' },
        })
      )
      expect(mockSaveCard).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Item Two',
          rank: 2,
          nickname: 'Two',
        })
      )
    })

    it('creates placeholder avatars for each item', async () => {
      const { result } = renderHook(() => useTemplateLoader())

      await act(async () => {
        await result.current.loadTemplate(testTemplate)
      })

      // 1 for cover image + 2 for items (full and thumbnail each = 2 calls per item)
      // Cover: 2 calls (400px + 200px)
      // Item 1: 2 calls (400px + 200px)
      // Item 2: 2 calls (400px + 200px)
      // Total: 6 calls
      expect(mockGeneratePlaceholderAvatar).toHaveBeenCalledTimes(6)
    })

    it('creates cover image when coverImagePlaceholder is provided', async () => {
      const { result } = renderHook(() => useTemplateLoader())

      await act(async () => {
        await result.current.loadTemplate(testTemplate)
      })

      // saveImage is called: 1 for cover + 2 for items = 3 times
      expect(mockSaveImage).toHaveBeenCalledTimes(3)
    })

    it('returns success result with board ID and counts', async () => {
      const { result } = renderHook(() => useTemplateLoader())

      let loadResult: Awaited<ReturnType<typeof result.current.loadTemplate>>

      await act(async () => {
        loadResult = await result.current.loadTemplate(testTemplate)
      })

      expect(loadResult!.success).toBe(true)
      expect(loadResult!.boardId).toBeDefined()
      expect(loadResult!.cardsCreated).toBe(2)
      expect(loadResult!.imagesCreated).toBe(3) // cover + 2 items
      expect(loadResult!.errors).toHaveLength(0)
    })

    it('handles avatar generation errors gracefully', async () => {
      mockGeneratePlaceholderAvatar
        .mockResolvedValueOnce(new Blob(['test'], { type: 'image/jpeg' })) // cover full
        .mockResolvedValueOnce(new Blob(['test'], { type: 'image/jpeg' })) // cover thumb
        .mockRejectedValueOnce(new Error('Avatar generation failed')) // item 1 fails

      const { result } = renderHook(() => useTemplateLoader())

      let loadResult: Awaited<ReturnType<typeof result.current.loadTemplate>>

      await act(async () => {
        loadResult = await result.current.loadTemplate(testTemplate)
      })

      expect(loadResult!.success).toBe(true)
      expect(loadResult!.errors.length).toBeGreaterThan(0)
      expect(loadResult!.errors[0]).toContain('Failed to create image')
    })

    it('creates cards even when image generation fails', async () => {
      mockGeneratePlaceholderAvatar.mockRejectedValue(new Error('All images fail'))

      const { result } = renderHook(() => useTemplateLoader())

      await act(async () => {
        await result.current.loadTemplate(testTemplate)
      })

      // Cards should still be created even without images
      expect(mockSaveCard).toHaveBeenCalledTimes(2)
    })

    it('handles template without cover image placeholder', async () => {
      const templateWithoutCover: BundledTemplate = {
        ...testTemplate,
        coverImagePlaceholder: undefined,
      }

      const { result } = renderHook(() => useTemplateLoader())

      await act(async () => {
        await result.current.loadTemplate(templateWithoutCover)
      })

      expect(mockSaveBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          coverImage: null,
        })
      )
    })
  })
})
