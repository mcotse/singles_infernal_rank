/**
 * useImageStorage Hook
 *
 * Manages image storage in IndexedDB with processing.
 * Handles compression, thumbnail generation, and blob URLs.
 */

import { useState, useCallback } from 'react'
import { saveImage as dbSaveImage, getImage as dbGetImage, getImages as dbGetImages, deleteImage as dbDeleteImage } from '../lib/db'
import { processImage, createImageUrl, revokeImageUrl } from '../lib/imageUtils'
import type { StoredImage } from '../lib/types'

interface UseImageStorageReturn {
  /** Whether an image is currently being processed */
  isProcessing: boolean
  /** Save an image (processes and stores in IndexedDB) */
  saveImage: (file: File | Blob) => Promise<string>
  /** Get a stored image by key */
  getImage: (key: string) => Promise<StoredImage | null>
  /** Get blob URL for full-size image */
  getImageUrl: (key: string) => Promise<string | null>
  /** Get blob URL for thumbnail */
  getThumbnailUrl: (key: string) => Promise<string | null>
  /** Get blob URLs for multiple thumbnails in a single batch (much faster) */
  getThumbnailUrls: (keys: string[]) => Promise<Map<string, string>>
  /** Delete an image by key */
  deleteImage: (key: string) => Promise<void>
  /** Revoke a blob URL to free memory */
  revokeUrl: (url: string) => void
}

/**
 * Generate a unique key for image storage
 */
const generateImageKey = (): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `img_${timestamp}_${random}`
}

export const useImageStorage = (): UseImageStorageReturn => {
  const [isProcessing, setIsProcessing] = useState(false)

  const saveImageFn = useCallback(async (file: File | Blob): Promise<string> => {
    setIsProcessing(true)

    try {
      // Process the image (compress + thumbnail)
      const processed = await processImage(file)

      // Generate unique key
      const key = generateImageKey()

      // Create stored image object
      const storedImage: StoredImage = {
        key,
        blob: processed.fullBlob,
        thumbnail: processed.thumbnailBlob,
        mimeType: processed.mimeType,
        createdAt: Date.now(),
      }

      // Save to IndexedDB
      await dbSaveImage(storedImage)

      return key
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const getImageFn = useCallback(async (key: string): Promise<StoredImage | null> => {
    return dbGetImage(key)
  }, [])

  const getImageUrl = useCallback(async (key: string): Promise<string | null> => {
    const image = await dbGetImage(key)
    if (!image) return null
    return createImageUrl(image.blob)
  }, [])

  const getThumbnailUrl = useCallback(async (key: string): Promise<string | null> => {
    const image = await dbGetImage(key)
    if (!image) return null
    return createImageUrl(image.thumbnail)
  }, [])

  const getThumbnailUrls = useCallback(async (keys: string[]): Promise<Map<string, string>> => {
    if (keys.length === 0) {
      return new Map()
    }

    const images = await dbGetImages(keys)
    const urls = new Map<string, string>()

    for (const [key, image] of images) {
      urls.set(key, createImageUrl(image.thumbnail))
    }

    return urls
  }, [])

  const deleteImageFn = useCallback(async (key: string): Promise<void> => {
    await dbDeleteImage(key)
  }, [])

  const revokeUrl = useCallback((url: string): void => {
    revokeImageUrl(url)
  }, [])

  return {
    isProcessing,
    saveImage: saveImageFn,
    getImage: getImageFn,
    getImageUrl,
    getThumbnailUrl,
    getThumbnailUrls,
    deleteImage: deleteImageFn,
    revokeUrl,
  }
}
