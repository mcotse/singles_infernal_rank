/**
 * Device Token Alias Generator
 *
 * Generates deterministic "Adjective Animal" aliases from device tokens
 * using a simple hash function. The same token always produces the same alias.
 */

const ADJECTIVES = [
  'Amber', 'Bold', 'Brave', 'Bright', 'Calm',
  'Clever', 'Coral', 'Cosmic', 'Crimson', 'Crystal',
  'Daring', 'Dawn', 'Eager', 'Ember', 'Fierce',
  'Fleet', 'Frosty', 'Gentle', 'Golden', 'Grand',
  'Hazel', 'Hidden', 'Icy', 'Iron', 'Jade',
  'Keen', 'Kind', 'Lively', 'Lucky', 'Lunar',
  'Maple', 'Misty', 'Noble', 'Olive', 'Onyx',
  'Pearl', 'Pine', 'Plum', 'Proud', 'Quick',
  'Quiet', 'Rosy', 'Royal', 'Rustic', 'Sandy',
  'Silver', 'Solar', 'Steady', 'Stone', 'Swift',
] as const

const ANIMALS = [
  'Bear', 'Cardinal', 'Cat', 'Crane', 'Deer',
  'Dolphin', 'Dove', 'Eagle', 'Elk', 'Falcon',
  'Finch', 'Fox', 'Hare', 'Hawk', 'Heron',
  'Horse', 'Jay', 'Koala', 'Lark', 'Leopard',
  'Lion', 'Lynx', 'Mantis', 'Marten', 'Newt',
  'Orca', 'Otter', 'Owl', 'Panda', 'Parrot',
  'Penguin', 'Pike', 'Puma', 'Quail', 'Raven',
  'Robin', 'Salmon', 'Seal', 'Shark', 'Sparrow',
  'Stag', 'Swan', 'Tiger', 'Toucan', 'Turtle',
  'Viper', 'Whale', 'Wolf', 'Wren', 'Zebra',
] as const

/**
 * Simple string hash (djb2 algorithm).
 * Returns a non-negative 32-bit integer.
 */
const hashString = (str: string): number => {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Generate a deterministic "Adjective Animal" alias from a device token.
 * The same token always produces the same alias.
 */
export const generateDeviceAlias = (deviceToken: string): string => {
  const hash = hashString(deviceToken)
  const adjIndex = hash % ADJECTIVES.length
  const animalIndex = Math.floor(hash / ADJECTIVES.length) % ANIMALS.length
  return `${ADJECTIVES[adjIndex]} ${ANIMALS[animalIndex]}`
}
