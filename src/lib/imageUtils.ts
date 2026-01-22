/**
 * Image Utilities
 *
 * Compression and thumbnail generation for card photos.
 * Uses canvas for resizing and format conversion.
 */

/**
 * Maximum dimensions for full-size images
 */
const MAX_FULL_SIZE = 800

/**
 * Thumbnail dimensions
 */
const THUMBNAIL_SIZE = 200

/**
 * Target quality for JPEG compression (0-1)
 */
const JPEG_QUALITY = 0.8

/**
 * Target quality for thumbnails (more aggressive compression)
 */
const THUMBNAIL_QUALITY = 0.6

/**
 * Result of processing an image
 */
export interface ProcessedImage {
  fullBlob: Blob
  thumbnailBlob: Blob
  mimeType: string
  width: number
  height: number
}

/**
 * Load an image from a File or Blob
 */
const loadImage = (source: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(source)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxSize: number
): { width: number; height: number } => {
  if (originalWidth <= maxSize && originalHeight <= maxSize) {
    return { width: originalWidth, height: originalHeight }
  }

  const ratio = Math.min(maxSize / originalWidth, maxSize / originalHeight)
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  }
}

/**
 * Draw image to canvas at specified dimensions
 */
const drawToCanvas = (
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

/**
 * Convert canvas to blob
 */
const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      },
      mimeType,
      quality
    )
  })
}

/**
 * Compress an image to target size
 *
 * @param source - Original image file or blob
 * @param maxSize - Maximum width/height
 * @param quality - JPEG quality (0-1)
 * @returns Compressed image blob
 */
export const compressImage = async (
  source: Blob,
  maxSize: number = MAX_FULL_SIZE,
  quality: number = JPEG_QUALITY
): Promise<Blob> => {
  const img = await loadImage(source)
  const { width, height } = calculateDimensions(img.width, img.height, maxSize)
  const canvas = drawToCanvas(img, width, height)

  return canvasToBlob(canvas, 'image/jpeg', quality)
}

/**
 * Generate a thumbnail from an image
 *
 * @param source - Original image file or blob
 * @param size - Thumbnail size (square)
 * @returns Thumbnail blob
 */
export const generateThumbnail = async (
  source: Blob,
  size: number = THUMBNAIL_SIZE
): Promise<Blob> => {
  const img = await loadImage(source)

  // For thumbnails, crop to square from center
  const minDimension = Math.min(img.width, img.height)
  const sx = (img.width - minDimension) / 2
  const sy = (img.height - minDimension) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Draw cropped square region
  ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, size, size)

  return canvasToBlob(canvas, 'image/jpeg', THUMBNAIL_QUALITY)
}

/**
 * Process an image: compress and generate thumbnail
 *
 * @param source - Original image file
 * @returns ProcessedImage with full and thumbnail blobs
 */
export const processImage = async (source: File | Blob): Promise<ProcessedImage> => {
  const img = await loadImage(source)

  // Compress full image
  const { width, height } = calculateDimensions(img.width, img.height, MAX_FULL_SIZE)
  const fullCanvas = drawToCanvas(img, width, height)
  const fullBlob = await canvasToBlob(fullCanvas, 'image/jpeg', JPEG_QUALITY)

  // Generate thumbnail
  const thumbnailBlob = await generateThumbnail(source)

  return {
    fullBlob,
    thumbnailBlob,
    mimeType: 'image/jpeg',
    width,
    height,
  }
}

/**
 * Get image dimensions from a blob
 */
export const getImageDimensions = async (
  source: Blob
): Promise<{ width: number; height: number }> => {
  const img = await loadImage(source)
  return { width: img.width, height: img.height }
}

/**
 * Create a blob URL for displaying an image
 * Remember to revoke with URL.revokeObjectURL when done
 */
export const createImageUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob)
}

/**
 * Revoke a blob URL to free memory
 */
export const revokeImageUrl = (url: string): void => {
  URL.revokeObjectURL(url)
}
