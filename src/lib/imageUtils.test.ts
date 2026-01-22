/**
 * Tests for Image Utilities
 *
 * These tests mock browser Canvas/Image APIs since jsdom doesn't fully support them.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  compressImage,
  generateThumbnail,
  processImage,
  getImageDimensions,
  createImageUrl,
  revokeImageUrl,
} from './imageUtils'

// Mock canvas context
const createMockContext = () => ({
  imageSmoothingEnabled: false,
  imageSmoothingQuality: 'low' as ImageSmoothingQuality,
  drawImage: vi.fn(),
})

// Mock canvas element
const createMockCanvas = (mockContext: ReturnType<typeof createMockContext>) => ({
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockContext),
  toBlob: vi.fn((callback: BlobCallback, mimeType: string, _quality: number) => {
    setTimeout(() => {
      callback(new Blob(['mock image data'], { type: mimeType }))
    }, 0)
  }),
})

describe('Image Utilities', () => {
  let mockContext: ReturnType<typeof createMockContext>
  let mockCanvas: ReturnType<typeof createMockCanvas>
  const originalCreateElement = document.createElement.bind(document)

  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = createMockContext()
    mockCanvas = createMockCanvas(mockContext)

    // Mock document.createElement for canvas
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as unknown as HTMLCanvasElement
      }
      return originalCreateElement(tagName)
    })

    // Mock URL methods
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Helper to create a mock image that loads successfully
  const mockImageLoad = (width: number, height: number) => {
    class MockImage {
      width = width
      height = height
      src = ''
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    }
    vi.stubGlobal('Image', MockImage)
  }

  // Helper to create a mock image that fails to load
  const mockImageError = () => {
    class MockImage {
      width = 0
      height = 0
      src = ''
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      constructor() {
        setTimeout(() => {
          if (this.onerror) this.onerror()
        }, 0)
      }
    }
    vi.stubGlobal('Image', MockImage)
  }

  describe('compressImage', () => {
    it('compresses an image to default max size', async () => {
      mockImageLoad(1200, 900)
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      const result = await compressImage(sourceBlob)

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('image/jpeg')
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d')
      expect(mockContext.drawImage).toHaveBeenCalled()
    })

    it('maintains aspect ratio when resizing', async () => {
      mockImageLoad(1600, 800) // 2:1 aspect ratio
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await compressImage(sourceBlob, 800)

      // Canvas should be set to maintain aspect ratio
      // 1600x800 scaled to max 800 = 800x400
      expect(mockCanvas.width).toBe(800)
      expect(mockCanvas.height).toBe(400)
    })

    it('does not upscale small images', async () => {
      mockImageLoad(400, 300) // Already smaller than default max
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await compressImage(sourceBlob)

      // Should keep original dimensions
      expect(mockCanvas.width).toBe(400)
      expect(mockCanvas.height).toBe(300)
    })

    it('uses custom max size when provided', async () => {
      mockImageLoad(1000, 1000)
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await compressImage(sourceBlob, 500)

      expect(mockCanvas.width).toBe(500)
      expect(mockCanvas.height).toBe(500)
    })

    it('uses high quality image smoothing', async () => {
      mockImageLoad(1000, 1000)
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await compressImage(sourceBlob)

      expect(mockContext.imageSmoothingEnabled).toBe(true)
      expect(mockContext.imageSmoothingQuality).toBe('high')
    })

    it('rejects when image fails to load', async () => {
      mockImageError()
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await expect(compressImage(sourceBlob)).rejects.toThrow('Failed to load image')
    })

    it('rejects when canvas context is unavailable', async () => {
      mockImageLoad(800, 600)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCanvas.getContext = vi.fn(() => null) as any
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await expect(compressImage(sourceBlob)).rejects.toThrow('Failed to get canvas context')
    })
  })

  describe('generateThumbnail', () => {
    it('generates a square thumbnail', async () => {
      mockImageLoad(800, 600)
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      const result = await generateThumbnail(sourceBlob)

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('image/jpeg')
      // Default thumbnail size is 200x200
      expect(mockCanvas.width).toBe(200)
      expect(mockCanvas.height).toBe(200)
    })

    it('uses custom size when provided', async () => {
      mockImageLoad(800, 600)
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await generateThumbnail(sourceBlob, 100)

      expect(mockCanvas.width).toBe(100)
      expect(mockCanvas.height).toBe(100)
    })

    it('crops from center for landscape images', async () => {
      mockImageLoad(1000, 600) // Landscape: 1000x600
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await generateThumbnail(sourceBlob, 200)

      // Should crop a 600x600 square from center
      // sx = (1000 - 600) / 2 = 200
      // sy = (600 - 600) / 2 = 0
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        200, // sx - offset from left
        0,   // sy - offset from top
        600, // source width (min dimension)
        600, // source height (min dimension)
        0,   // destination x
        0,   // destination y
        200, // destination width
        200  // destination height
      )
    })

    it('crops from center for portrait images', async () => {
      mockImageLoad(600, 1000) // Portrait: 600x1000
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await generateThumbnail(sourceBlob, 200)

      // Should crop a 600x600 square from center
      // sx = (600 - 600) / 2 = 0
      // sy = (1000 - 600) / 2 = 200
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        0,   // sx
        200, // sy - offset from top
        600, // source width
        600, // source height
        0,   // destination x
        0,   // destination y
        200, // destination width
        200  // destination height
      )
    })
  })

  describe('processImage', () => {
    it('returns both full and thumbnail blobs', async () => {
      mockImageLoad(1200, 900)
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      const result = await processImage(sourceBlob)

      expect(result.fullBlob).toBeInstanceOf(Blob)
      expect(result.thumbnailBlob).toBeInstanceOf(Blob)
      expect(result.mimeType).toBe('image/jpeg')
    })

    it('returns correct dimensions', async () => {
      mockImageLoad(1200, 900) // Will be scaled to 800x600 (max 800)
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      const result = await processImage(sourceBlob)

      expect(result.width).toBe(800)
      expect(result.height).toBe(600)
    })

    it('works with File objects', async () => {
      mockImageLoad(800, 600)
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const result = await processImage(file)

      expect(result.fullBlob).toBeInstanceOf(Blob)
      expect(result.thumbnailBlob).toBeInstanceOf(Blob)
    })
  })

  describe('getImageDimensions', () => {
    it('returns image dimensions', async () => {
      mockImageLoad(1920, 1080)
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      const dimensions = await getImageDimensions(sourceBlob)

      expect(dimensions.width).toBe(1920)
      expect(dimensions.height).toBe(1080)
    })
  })

  describe('createImageUrl', () => {
    it('creates a blob URL', () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' })

      const url = createImageUrl(blob)

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
      expect(url).toBe('blob:mock-url')
    })
  })

  describe('revokeImageUrl', () => {
    it('revokes a blob URL', () => {
      const url = 'blob:test-url'

      revokeImageUrl(url)

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url)
    })
  })

  describe('error handling', () => {
    it('handles toBlob failure', async () => {
      mockImageLoad(800, 600)
      mockCanvas.toBlob = vi.fn((callback: BlobCallback) => {
        setTimeout(() => callback(null), 0)
      })
      const sourceBlob = new Blob(['test'], { type: 'image/jpeg' })

      await expect(compressImage(sourceBlob)).rejects.toThrow('Failed to create blob from canvas')
    })
  })
})
