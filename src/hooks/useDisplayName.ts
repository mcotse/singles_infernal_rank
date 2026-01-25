import type { Card, RankingEntry } from '../lib/types'

/**
 * Get the display name for a card based on nickname mode
 *
 * @param card - The card object
 * @param useNickname - Whether to prefer nickname over real name
 * @returns The nickname if available and useNickname is true, otherwise the real name
 */
export const getDisplayName = (
  card: Pick<Card, 'name' | 'nickname'>,
  useNickname: boolean
): string => {
  if (useNickname && card.nickname && card.nickname.trim() !== '') {
    return card.nickname
  }
  return card.name
}

/**
 * Get the display name for a ranking entry based on nickname mode
 * Used for snapshot data which may have a separate cardNickname field
 *
 * @param entry - The ranking entry from a snapshot
 * @param useNickname - Whether to prefer nickname over real name
 * @returns The nickname if available and useNickname is true, otherwise the real name
 */
export const getDisplayNameFromEntry = (
  entry: Pick<RankingEntry, 'cardName' | 'cardNickname'>,
  useNickname: boolean
): string => {
  if (useNickname && entry.cardNickname && entry.cardNickname.trim() !== '') {
    return entry.cardNickname
  }
  return entry.cardName
}
