/**
 * IndexedDB Wrapper for Image Storage
 *
 * Stores full resolution images and thumbnails as blobs.
 * Uses a single object store for all images.
 */

import type { StoredImage } from './types'

const DB_NAME = 'singles-infernal-rank'
const DB_VERSION = 1
const STORE_NAME = 'images'

let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Open or create the IndexedDB database
 */
const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create images store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })

  return dbPromise
}

/**
 * Save an image to IndexedDB
 */
export const saveImage = async (image: StoredImage): Promise<void> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(image)

    request.onerror = () => {
      reject(new Error(`Failed to save image: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}

/**
 * Get an image from IndexedDB by key
 */
export const getImage = async (key: string): Promise<StoredImage | null> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)

    request.onerror = () => {
      reject(new Error(`Failed to get image: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      resolve(request.result || null)
    }
  })
}

/**
 * Get multiple images from IndexedDB in a single transaction (batch read)
 * Much faster than calling getImage() multiple times
 */
export const getImages = async (keys: string[]): Promise<Map<string, StoredImage>> => {
  if (keys.length === 0) {
    return new Map()
  }

  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const results = new Map<string, StoredImage>()
    let completed = 0
    let hasError = false

    // Request all images in parallel within single transaction
    for (const key of keys) {
      const request = store.get(key)

      request.onerror = () => {
        if (!hasError) {
          hasError = true
          reject(new Error(`Failed to get image ${key}: ${request.error?.message}`))
        }
      }

      request.onsuccess = () => {
        if (request.result) {
          results.set(key, request.result)
        }
        completed++
        if (completed === keys.length && !hasError) {
          resolve(results)
        }
      }
    }
  })
}

/**
 * Delete an image from IndexedDB
 */
export const deleteImage = async (key: string): Promise<void> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(key)

    request.onerror = () => {
      reject(new Error(`Failed to delete image: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}

/**
 * Get all image keys from IndexedDB
 */
export const getAllImageKeys = async (): Promise<string[]> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAllKeys()

    request.onerror = () => {
      reject(new Error(`Failed to get image keys: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      resolve(request.result as string[])
    }
  })
}

/**
 * Clear all images from IndexedDB
 */
export const clearAllImages = async (): Promise<void> => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onerror = () => {
      reject(new Error(`Failed to clear images: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}

/**
 * Close the database connection (useful for testing)
 */
export const closeDB = (): void => {
  if (dbPromise) {
    dbPromise.then((db) => db.close())
    dbPromise = null
  }
}

/**
 * Delete the entire database (useful for testing/reset)
 */
export const deleteDB = (): Promise<void> => {
  closeDB()

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)

    request.onerror = () => {
      reject(new Error(`Failed to delete database: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}
