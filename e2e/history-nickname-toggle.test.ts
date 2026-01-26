import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173/hot-takes/'

test.describe('History Timeline Nickname Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear data and start fresh
    await page.goto(BASE_URL)
    await page.evaluate(() => {
      localStorage.clear()
      indexedDB.deleteDatabase('singles-infernal-rank-images')
    })
    await page.reload()
    await page.waitForTimeout(500)
  })

  test('should show top 3 rankings inline and toggle nicknames', async ({ page }) => {
    // Create test data with nicknames via localStorage
    await page.evaluate(() => {
      const now = Date.now()

      // Create a test board
      const boards = [{
        id: 'test-board-1',
        name: 'Test Board',
        coverImage: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }]

      // Create test cards with nicknames
      const cards = [
        { id: 'card-1', boardId: 'test-board-1', name: 'Alice Smith', nickname: 'Ally', rank: 1, createdAt: now, updatedAt: now, imageKey: null, thumbnailKey: null, imageCrop: null, notes: '', metadata: {} },
        { id: 'card-2', boardId: 'test-board-1', name: 'Bob Johnson', nickname: 'Bobby', rank: 2, createdAt: now, updatedAt: now, imageKey: null, thumbnailKey: null, imageCrop: null, notes: '', metadata: {} },
        { id: 'card-3', boardId: 'test-board-1', name: 'Charlie Brown', nickname: 'Chuck', rank: 3, createdAt: now, updatedAt: now, imageKey: null, thumbnailKey: null, imageCrop: null, notes: '', metadata: {} },
        { id: 'card-4', boardId: 'test-board-1', name: 'Diana Prince', nickname: 'Di', rank: 4, createdAt: now, updatedAt: now, imageKey: null, thumbnailKey: null, imageCrop: null, notes: '', metadata: {} },
      ]

      // Create snapshots with nickname data
      const snapshots = [
        {
          id: 'snapshot-1',
          boardId: 'test-board-1',
          episodeNumber: 1,
          label: 'Episode 1',
          notes: 'First episode rankings',
          rankings: [
            { cardId: 'card-1', cardName: 'Alice Smith', cardNickname: 'Ally', rank: 1, thumbnailKey: null },
            { cardId: 'card-2', cardName: 'Bob Johnson', cardNickname: 'Bobby', rank: 2, thumbnailKey: null },
            { cardId: 'card-3', cardName: 'Charlie Brown', cardNickname: 'Chuck', rank: 3, thumbnailKey: null },
            { cardId: 'card-4', cardName: 'Diana Prince', cardNickname: 'Di', rank: 4, thumbnailKey: null },
          ],
          createdAt: now - 7 * 24 * 60 * 60 * 1000, // 1 week ago
        },
        {
          id: 'snapshot-2',
          boardId: 'test-board-1',
          episodeNumber: 2,
          label: 'Episode 2',
          notes: 'Second episode rankings',
          rankings: [
            { cardId: 'card-2', cardName: 'Bob Johnson', cardNickname: 'Bobby', rank: 1, thumbnailKey: null },
            { cardId: 'card-1', cardName: 'Alice Smith', cardNickname: 'Ally', rank: 2, thumbnailKey: null },
            { cardId: 'card-4', cardName: 'Diana Prince', cardNickname: 'Di', rank: 3, thumbnailKey: null },
            { cardId: 'card-3', cardName: 'Charlie Brown', cardNickname: 'Chuck', rank: 4, thumbnailKey: null },
          ],
          createdAt: now, // Now
        },
      ]

      localStorage.setItem('singles-infernal-rank:boards', JSON.stringify(boards))
      localStorage.setItem('singles-infernal-rank:cards', JSON.stringify(cards))
      localStorage.setItem('singles-infernal-rank:snapshots', JSON.stringify(snapshots))
    })

    await page.reload()
    await page.waitForTimeout(500)

    // Navigate to History tab
    const historyTab = page.locator('button:has-text("History"), [data-testid="history-tab"]')
    await historyTab.click()
    await page.waitForTimeout(500)

    // Verify we're on the history page in list view (default)
    const historyHeader = page.locator('h1:has-text("History")')
    await expect(historyHeader).toBeVisible()

    // Take screenshot of initial state
    await page.screenshot({ path: 'e2e/screenshots/history-nickname-01-initial.png', fullPage: true })

    // Verify episode cards are visible with top 3 preview showing real names
    const episodeCards = page.locator('[role="button"]').filter({ hasText: 'Episode' })
    await expect(episodeCards).toHaveCount(2)

    // Check Episode 1 shows top 3 real names
    const episode1Card = page.locator('[role="button"]').filter({ hasText: 'Episode 1' })
    await expect(episode1Card).toBeVisible()
    await expect(episode1Card).toContainText('1. Alice Smith')
    await expect(episode1Card).toContainText('2. Bob Johnson')
    await expect(episode1Card).toContainText('3. Charlie Brown')

    // Check Episode 2 shows its top 3 real names
    const episode2Card = page.locator('[role="button"]').filter({ hasText: 'Episode 2' })
    await expect(episode2Card).toBeVisible()
    await expect(episode2Card).toContainText('1. Bob Johnson')
    await expect(episode2Card).toContainText('2. Alice Smith')
    await expect(episode2Card).toContainText('3. Diana Prince')

    // Find and verify nickname toggle is visible (since we have nicknames)
    const nicknameToggle = page.locator('button').filter({ hasText: 'Names' })
    await expect(nicknameToggle).toBeVisible()

    // Take screenshot before toggle
    await page.screenshot({ path: 'e2e/screenshots/history-nickname-02-before-toggle.png', fullPage: true })

    // Click toggle to switch to nicknames
    await nicknameToggle.click()
    await page.waitForTimeout(300)

    // Take screenshot after toggle
    await page.screenshot({ path: 'e2e/screenshots/history-nickname-03-after-toggle.png', fullPage: true })

    // Verify toggle now shows "Nicknames"
    const nicknameToggleAfter = page.locator('button').filter({ hasText: 'Nicknames' })
    await expect(nicknameToggleAfter).toBeVisible()

    // Verify Episode 1 now shows nicknames
    await expect(episode1Card).toContainText('1. Ally')
    await expect(episode1Card).toContainText('2. Bobby')
    await expect(episode1Card).toContainText('3. Chuck')

    // Verify Episode 2 now shows nicknames
    await expect(episode2Card).toContainText('1. Bobby')
    await expect(episode2Card).toContainText('2. Ally')
    await expect(episode2Card).toContainText('3. Di')

    // Toggle back to real names
    await nicknameToggleAfter.click()
    await page.waitForTimeout(300)

    // Verify we're back to real names
    await expect(episode1Card).toContainText('1. Alice Smith')
    await expect(episode2Card).toContainText('1. Bob Johnson')

    console.log('All history nickname toggle tests passed!')
  })

  test('should persist nickname toggle setting after refresh', async ({ page }) => {
    // Create test data with nicknames
    await page.evaluate(() => {
      const now = Date.now()

      const boards = [{
        id: 'test-board-1',
        name: 'Test Board',
        coverImage: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }]

      const cards = [
        { id: 'card-1', boardId: 'test-board-1', name: 'Alice Smith', nickname: 'Ally', rank: 1, createdAt: now, updatedAt: now, imageKey: null, thumbnailKey: null, imageCrop: null, notes: '', metadata: {} },
        { id: 'card-2', boardId: 'test-board-1', name: 'Bob Johnson', nickname: 'Bobby', rank: 2, createdAt: now, updatedAt: now, imageKey: null, thumbnailKey: null, imageCrop: null, notes: '', metadata: {} },
      ]

      const snapshots = [{
        id: 'snapshot-1',
        boardId: 'test-board-1',
        episodeNumber: 1,
        label: 'Episode 1',
        notes: '',
        rankings: [
          { cardId: 'card-1', cardName: 'Alice Smith', cardNickname: 'Ally', rank: 1, thumbnailKey: null },
          { cardId: 'card-2', cardName: 'Bob Johnson', cardNickname: 'Bobby', rank: 2, thumbnailKey: null },
        ],
        createdAt: now,
      }]

      localStorage.setItem('singles-infernal-rank:boards', JSON.stringify(boards))
      localStorage.setItem('singles-infernal-rank:cards', JSON.stringify(cards))
      localStorage.setItem('singles-infernal-rank:snapshots', JSON.stringify(snapshots))
    })

    await page.reload()
    await page.waitForTimeout(500)

    // Navigate to History tab
    const historyTab = page.locator('button:has-text("History"), [data-testid="history-tab"]')
    await historyTab.click()
    await page.waitForTimeout(500)

    // Toggle to nicknames
    const nicknameToggle = page.locator('button').filter({ hasText: 'Names' })
    await expect(nicknameToggle).toBeVisible()
    await nicknameToggle.click()
    await page.waitForTimeout(300)

    // Verify nicknames are shown
    const episodeCard = page.locator('[role="button"]').filter({ hasText: 'Episode 1' })
    await expect(episodeCard).toContainText('1. Ally')

    // Reload the page
    await page.reload()
    await page.waitForTimeout(500)

    // Navigate back to History tab
    await historyTab.click()
    await page.waitForTimeout(500)

    // Verify nickname toggle is still set to nicknames mode
    const nicknameToggleAfterReload = page.locator('button').filter({ hasText: 'Nicknames' })
    await expect(nicknameToggleAfterReload).toBeVisible()

    // Verify nicknames are still shown after reload
    const episodeCardAfterReload = page.locator('[role="button"]').filter({ hasText: 'Episode 1' })
    await expect(episodeCardAfterReload).toContainText('1. Ally')

    console.log('Nickname toggle persistence test passed!')
  })

  test('should not show nickname toggle when no entries have nicknames', async ({ page }) => {
    // Create test data WITHOUT nicknames
    await page.evaluate(() => {
      const now = Date.now()

      const boards = [{
        id: 'test-board-1',
        name: 'Test Board',
        coverImage: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }]

      const cards = [
        { id: 'card-1', boardId: 'test-board-1', name: 'Alice Smith', nickname: '', rank: 1, createdAt: now, updatedAt: now, imageKey: null, thumbnailKey: null, imageCrop: null, notes: '', metadata: {} },
        { id: 'card-2', boardId: 'test-board-1', name: 'Bob Johnson', nickname: '', rank: 2, createdAt: now, updatedAt: now, imageKey: null, thumbnailKey: null, imageCrop: null, notes: '', metadata: {} },
      ]

      // Snapshots without cardNickname
      const snapshots = [{
        id: 'snapshot-1',
        boardId: 'test-board-1',
        episodeNumber: 1,
        label: 'Episode 1',
        notes: '',
        rankings: [
          { cardId: 'card-1', cardName: 'Alice Smith', rank: 1, thumbnailKey: null },
          { cardId: 'card-2', cardName: 'Bob Johnson', rank: 2, thumbnailKey: null },
        ],
        createdAt: now,
      }]

      localStorage.setItem('singles-infernal-rank:boards', JSON.stringify(boards))
      localStorage.setItem('singles-infernal-rank:cards', JSON.stringify(cards))
      localStorage.setItem('singles-infernal-rank:snapshots', JSON.stringify(snapshots))
    })

    await page.reload()
    await page.waitForTimeout(500)

    // Navigate to History tab
    const historyTab = page.locator('button:has-text("History"), [data-testid="history-tab"]')
    await historyTab.click()
    await page.waitForTimeout(500)

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/history-nickname-04-no-toggle.png', fullPage: true })

    // Verify episode card is visible with top rankings
    const episodeCard = page.locator('[role="button"]').filter({ hasText: 'Episode 1' })
    await expect(episodeCard).toBeVisible()
    await expect(episodeCard).toContainText('1. Alice Smith')

    // Verify nickname toggle is NOT visible (no nicknames in data)
    const nicknameToggle = page.locator('button').filter({ hasText: /Names|Nicknames/ })
    await expect(nicknameToggle).not.toBeVisible()

    console.log('No nickname toggle when no nicknames test passed!')
  })
})
