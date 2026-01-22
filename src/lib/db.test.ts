import 'fake-indexeddb/auto'
import {
  saveImage,
  getImage,
  deleteImage,
  getAllImageKeys,
  clearAllImages,
  deleteDB,
} from './db'
import type { StoredImage } from './types'

describe('IndexedDB Storage', () => {
  beforeEach(async () => {
    await deleteDB()
  })

  afterAll(async () => {
    await deleteDB()
  })

  const createTestImage = (key: string): StoredImage => ({
    key,
    blob: new Blob(['test image data'], { type: 'image/jpeg' }),
    thumbnail: new Blob(['thumbnail data'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    createdAt: Date.now(),
  })

  describe('saveImage', () => {
    it('saves an image to IndexedDB', async () => {
      const image = createTestImage('test-key-1')

      await saveImage(image)
      const retrieved = await getImage('test-key-1')

      expect(retrieved).not.toBeNull()
      expect(retrieved?.key).toBe('test-key-1')
      expect(retrieved?.mimeType).toBe('image/jpeg')
    })

    it('overwrites existing image with same key', async () => {
      const image1 = createTestImage('same-key')
      const image2 = { ...createTestImage('same-key'), mimeType: 'image/png' }

      await saveImage(image1)
      await saveImage(image2)

      const retrieved = await getImage('same-key')
      expect(retrieved?.mimeType).toBe('image/png')
    })
  })

  describe('getImage', () => {
    it('returns null for non-existent key', async () => {
      const result = await getImage('non-existent')
      expect(result).toBeNull()
    })

    it('retrieves image with blob data', async () => {
      const image = createTestImage('blob-test')
      await saveImage(image)

      const retrieved = await getImage('blob-test')
      // fake-indexeddb may not preserve Blob type, so just check existence
      expect(retrieved?.blob).toBeDefined()
      expect(retrieved?.thumbnail).toBeDefined()
    })
  })

  describe('deleteImage', () => {
    it('deletes an image', async () => {
      const image = createTestImage('to-delete')
      await saveImage(image)

      await deleteImage('to-delete')
      const retrieved = await getImage('to-delete')

      expect(retrieved).toBeNull()
    })

    it('does not throw when deleting non-existent key', async () => {
      await expect(deleteImage('non-existent')).resolves.not.toThrow()
    })
  })

  describe('getAllImageKeys', () => {
    it('returns empty array when no images', async () => {
      const keys = await getAllImageKeys()
      expect(keys).toEqual([])
    })

    it('returns all image keys', async () => {
      await saveImage(createTestImage('key-1'))
      await saveImage(createTestImage('key-2'))
      await saveImage(createTestImage('key-3'))

      const keys = await getAllImageKeys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('key-1')
      expect(keys).toContain('key-2')
      expect(keys).toContain('key-3')
    })
  })

  describe('clearAllImages', () => {
    it('removes all images', async () => {
      await saveImage(createTestImage('key-1'))
      await saveImage(createTestImage('key-2'))

      await clearAllImages()
      const keys = await getAllImageKeys()

      expect(keys).toEqual([])
    })
  })
})
