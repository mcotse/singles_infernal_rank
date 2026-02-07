/**
 * Firebase Storage Service
 *
 * Utilities for uploading and downloading card images to/from Firebase Storage.
 * Path structure: spaces/{spaceId}/boards/{boardId}/cards/{cardId}.jpg
 */

import { getFirebaseStorage, USE_MOCK_AUTH } from './firebase'
import { apiLogger as log, startTiming } from './logger'

/**
 * Upload a card image to Firebase Storage
 * @returns The download URL for the uploaded image
 */
export const uploadCardImage = async (
  spaceId: string,
  boardId: string,
  cardId: string,
  imageBlob: Blob
): Promise<string> => {
  if (USE_MOCK_AUTH) {
    // In mock mode, create a local object URL
    return URL.createObjectURL(imageBlob)
  }

  const timing = startTiming('upload_card_image')

  try {
    const storage = await getFirebaseStorage()
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')

    const imagePath = `spaces/${spaceId}/boards/${boardId}/cards/${cardId}.jpg`
    const imageRef = ref(storage, imagePath)

    await uploadBytes(imageRef, imageBlob, {
      contentType: imageBlob.type || 'image/jpeg',
    })

    const downloadUrl = await getDownloadURL(imageRef)
    timing.end({ path: imagePath })
    return downloadUrl
  } catch (err) {
    timing.fail(err)
    log.error('upload_card_image_failed', { spaceId, boardId, cardId, error: err })
    throw err
  }
}

/**
 * Upload a board cover image to Firebase Storage
 * @returns The download URL for the uploaded image
 */
export const uploadBoardCoverImage = async (
  spaceId: string,
  boardId: string,
  imageBlob: Blob
): Promise<string> => {
  if (USE_MOCK_AUTH) {
    return URL.createObjectURL(imageBlob)
  }

  const timing = startTiming('upload_board_cover')

  try {
    const storage = await getFirebaseStorage()
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')

    const imagePath = `spaces/${spaceId}/boards/${boardId}/cover.jpg`
    const imageRef = ref(storage, imagePath)

    await uploadBytes(imageRef, imageBlob, {
      contentType: imageBlob.type || 'image/jpeg',
    })

    const downloadUrl = await getDownloadURL(imageRef)
    timing.end({ path: imagePath })
    return downloadUrl
  } catch (err) {
    timing.fail(err)
    log.error('upload_board_cover_failed', { spaceId, boardId, error: err })
    throw err
  }
}

/**
 * Get a download URL for a Firebase Storage path
 */
export const getStorageDownloadUrl = async (path: string): Promise<string | null> => {
  if (USE_MOCK_AUTH) {
    return null
  }

  try {
    const storage = await getFirebaseStorage()
    const { ref, getDownloadURL } = await import('firebase/storage')

    const fileRef = ref(storage, path)
    return await getDownloadURL(fileRef)
  } catch (err) {
    // File may not exist, which is fine
    log.debug('get_storage_url_failed', { path, error: err })
    return null
  }
}

/**
 * Delete a card image from Firebase Storage
 */
export const deleteCardImage = async (
  spaceId: string,
  boardId: string,
  cardId: string
): Promise<void> => {
  if (USE_MOCK_AUTH) return

  try {
    const storage = await getFirebaseStorage()
    const { ref, deleteObject } = await import('firebase/storage')

    const imagePath = `spaces/${spaceId}/boards/${boardId}/cards/${cardId}.jpg`
    const imageRef = ref(storage, imagePath)
    await deleteObject(imageRef)
  } catch (err) {
    // Ignore errors - file may not exist
    log.debug('delete_card_image_failed', { spaceId, boardId, cardId, error: err })
  }
}

/**
 * Delete all images for a board from Firebase Storage
 */
export const deleteBoardImages = async (
  spaceId: string,
  boardId: string
): Promise<void> => {
  if (USE_MOCK_AUTH) return

  try {
    const storage = await getFirebaseStorage()
    const { ref, listAll, deleteObject } = await import('firebase/storage')

    const boardPath = `spaces/${spaceId}/boards/${boardId}`
    const boardRef = ref(storage, boardPath)

    // List all items in the board folder
    const result = await listAll(boardRef)

    // Delete all files
    await Promise.all(result.items.map((item) => deleteObject(item)))

    // Also check for cards subfolder
    const cardsRef = ref(storage, `${boardPath}/cards`)
    try {
      const cardsResult = await listAll(cardsRef)
      await Promise.all(cardsResult.items.map((item) => deleteObject(item)))
    } catch {
      // Cards folder may not exist
    }
  } catch (err) {
    log.debug('delete_board_images_failed', { spaceId, boardId, error: err })
  }
}
