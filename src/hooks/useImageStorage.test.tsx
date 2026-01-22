import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useImageStorage } from './useImageStorage'
import * as db from '../lib/db'
import * as imageUtils from '../lib/imageUtils'
import type { StoredImage } from '../lib/types'

// Mock the modules
vi.mock('../lib/db')
vi.mock('../lib/imageUtils')

const mockDb = vi.mocked(db)
const mockImageUtils = vi.mocked(imageUtils)

describe('useImageStorage', () => {
  const mockStoredImage: StoredImage = {
    key: 'test-key',
    blob: new Blob(['test'], { type: 'image/jpeg' }),
    thumbnail: new Blob(['thumb'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    createdAt: Date.now(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementations
    mockDb.saveImage.mockResolvedValue(undefined)
    mockDb.getImage.mockResolvedValue(null)
    mockDb.deleteImage.mockResolvedValue(undefined)
    mockImageUtils.createImageUrl.mockImplementation(() => 'blob:mock-url')
    mockImageUtils.revokeImageUrl.mockImplementation(() => {})
    mockImageUtils.processImage.mockResolvedValue({
      fullBlob: new Blob(['full'], { type: 'image/jpeg' }),
      thumbnailBlob: new Blob(['thumb'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      width: 800,
      height: 600,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('saveImage', () => {
    it('processes and saves image to IndexedDB', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const { result } = renderHook(() => useImageStorage())

      let imageKey: string | undefined
      await act(async () => {
        imageKey = await result.current.saveImage(file)
      })

      expect(mockImageUtils.processImage).toHaveBeenCalledWith(file)
      expect(mockDb.saveImage).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'image/jpeg',
        })
      )
      expect(imageKey).toBeDefined()
    })

    it('returns unique key for each image', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const { result } = renderHook(() => useImageStorage())

      let key1: string | undefined
      let key2: string | undefined

      await act(async () => {
        key1 = await result.current.saveImage(file)
      })

      await act(async () => {
        key2 = await result.current.saveImage(file)
      })

      expect(key1).not.toBe(key2)
    })

    it('handles save errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      mockImageUtils.processImage.mockRejectedValue(new Error('Processing failed'))

      const { result } = renderHook(() => useImageStorage())

      await expect(
        act(async () => {
          await result.current.saveImage(file)
        })
      ).rejects.toThrow('Processing failed')
    })
  })

  describe('getImage', () => {
    it('retrieves image from IndexedDB', async () => {
      mockDb.getImage.mockResolvedValue(mockStoredImage)

      const { result } = renderHook(() => useImageStorage())

      let image: StoredImage | null = null
      await act(async () => {
        image = await result.current.getImage('test-key')
      })

      expect(mockDb.getImage).toHaveBeenCalledWith('test-key')
      expect(image).toEqual(mockStoredImage)
    })

    it('returns null for non-existent key', async () => {
      mockDb.getImage.mockResolvedValue(null)

      const { result } = renderHook(() => useImageStorage())

      let image: StoredImage | null = null
      await act(async () => {
        image = await result.current.getImage('non-existent')
      })

      expect(image).toBeNull()
    })
  })

  describe('getImageUrl', () => {
    it('creates blob URL for image', async () => {
      mockDb.getImage.mockResolvedValue(mockStoredImage)

      const { result } = renderHook(() => useImageStorage())

      let url: string | null = null
      await act(async () => {
        url = await result.current.getImageUrl('test-key')
      })

      expect(mockImageUtils.createImageUrl).toHaveBeenCalledWith(mockStoredImage.blob)
      expect(url).toBe('blob:mock-url')
    })

    it('returns null for non-existent image', async () => {
      mockDb.getImage.mockResolvedValue(null)

      const { result } = renderHook(() => useImageStorage())

      let url: string | null = null
      await act(async () => {
        url = await result.current.getImageUrl('non-existent')
      })

      expect(url).toBeNull()
    })
  })

  describe('getThumbnailUrl', () => {
    it('creates blob URL for thumbnail', async () => {
      mockDb.getImage.mockResolvedValue(mockStoredImage)

      const { result } = renderHook(() => useImageStorage())

      let url: string | null = null
      await act(async () => {
        url = await result.current.getThumbnailUrl('test-key')
      })

      expect(mockImageUtils.createImageUrl).toHaveBeenCalledWith(mockStoredImage.thumbnail)
      expect(url).toBe('blob:mock-url')
    })

    it('returns null for non-existent image', async () => {
      mockDb.getImage.mockResolvedValue(null)

      const { result } = renderHook(() => useImageStorage())

      let url: string | null = null
      await act(async () => {
        url = await result.current.getThumbnailUrl('non-existent')
      })

      expect(url).toBeNull()
    })
  })

  describe('deleteImage', () => {
    it('deletes image from IndexedDB', async () => {
      const { result } = renderHook(() => useImageStorage())

      await act(async () => {
        await result.current.deleteImage('test-key')
      })

      expect(mockDb.deleteImage).toHaveBeenCalledWith('test-key')
    })
  })

  describe('revokeUrl', () => {
    it('revokes a blob URL', () => {
      const { result } = renderHook(() => useImageStorage())

      act(() => {
        result.current.revokeUrl('blob:test-url')
      })

      expect(mockImageUtils.revokeImageUrl).toHaveBeenCalledWith('blob:test-url')
    })
  })

  describe('isProcessing state', () => {
    it('starts as false', () => {
      const { result } = renderHook(() => useImageStorage())

      expect(result.current.isProcessing).toBe(false)
    })

    it('is false after processing completes', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const { result } = renderHook(() => useImageStorage())

      await act(async () => {
        await result.current.saveImage(file)
      })

      expect(result.current.isProcessing).toBe(false)
    })

    it('is false after processing fails', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      mockImageUtils.processImage.mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useImageStorage())

      try {
        await act(async () => {
          await result.current.saveImage(file)
        })
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })
    })
  })
})
