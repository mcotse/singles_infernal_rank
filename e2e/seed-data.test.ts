import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173/hot-takes/'

test.describe('Seed Data Loading and Card Editing', () => {
  test('should load seed data, display both boards, and allow card editing', async ({ page }) => {
    // Clear data and start fresh
    await page.goto(BASE_URL)
    await page.evaluate(() => {
      localStorage.clear()
      indexedDB.deleteDatabase('singles-infernal-rank-images')
    })
    await page.reload()
    await page.waitForTimeout(1000)

    // Navigate to Settings to load sample data
    const settingsTab = page.locator('button:has-text("Settings"), [data-testid="settings-tab"]')
    await settingsTab.click()
    await page.waitForTimeout(500)

    // Take screenshot of settings page
    await page.screenshot({ path: 'e2e/screenshots/01-settings-page.png', fullPage: true })

    // Click "Load Cast & Photos" button
    const loadButton = page.locator('button:has-text("Load Cast & Photos")')
    await expect(loadButton).toBeVisible()
    await loadButton.click()

    // Wait for loading to complete
    await page.waitForTimeout(3000)

    // Take screenshot showing success message
    await page.screenshot({ path: 'e2e/screenshots/02-seed-loaded.png', fullPage: true })

    // Verify success message
    const successMessage = page.locator('text=Created 2 boards')
    await expect(successMessage).toBeVisible({ timeout: 5000 })

    // Navigate to Boards tab
    const boardsTab = page.locator('button:has-text("Boards"), [data-testid="boards-tab"]')
    await boardsTab.click()
    await page.waitForTimeout(1000)

    // Take screenshot of boards list
    await page.screenshot({ path: 'e2e/screenshots/03-boards-list.png', fullPage: true })

    // Verify both boards exist (BoardCard is a button with aria-label containing board name)
    const womenBoard = page.locator('button[aria-label*="Singles Inferno S5"]').filter({ hasText: '👩' })
    const menBoard = page.locator('button[aria-label*="Singles Inferno S5"]').filter({ hasText: '👨' })
    await expect(womenBoard).toBeVisible()
    await expect(menBoard).toBeVisible()

    // Click on the Women's board
    await womenBoard.click()
    await page.waitForTimeout(1000)

    // Take screenshot of board detail page (verify no unwanted dialogs)
    await page.screenshot({ path: 'e2e/screenshots/04-board-detail.png', fullPage: true })

    // Verify we're on the detail page with cards
    const rankCards = page.locator('[data-testid="rank-card"]')
    await expect(rankCards.first()).toBeVisible({ timeout: 5000 })

    // Count the cards (should be 6 women)
    const cardCount = await rankCards.count()
    expect(cardCount).toBe(6)

    // Click on the first card to edit
    await rankCards.first().click()
    await page.waitForTimeout(500)

    // Take screenshot of edit modal
    await page.screenshot({ path: 'e2e/screenshots/05-edit-modal.png', fullPage: true })

    // Find the name input
    const nameInput = page.locator('input').first()
    await expect(nameInput).toBeVisible()

    // Get original name and add "(edited)"
    const originalName = await nameInput.inputValue()
    const newName = originalName + ' (edited)'
    await nameInput.fill(newName)

    // Click save button directly (z-index fix ensures modal is above TabBar)
    const saveButton = page.locator('button:has-text("Save Changes")')
    await saveButton.click()
    await page.waitForTimeout(1000)

    // Take screenshot after save
    await page.screenshot({ path: 'e2e/screenshots/06-after-edit.png', fullPage: true })

    // Wait for modal to close and verify the change is visible in the list
    await page.waitForSelector('[data-testid="rank-card"]', { timeout: 5000 })
    const cardNames = page.locator('[data-testid="rank-card"]')
    const firstCardText = await cardNames.first().textContent()
    console.log('First card text after edit:', firstCardText)
    expect(firstCardText).toContain('(edited)')

    // Reload the page to verify persistence
    await page.reload()
    await page.waitForTimeout(2000)

    // Navigate back to the women's board
    const womenBoardAfterReload = page.locator('button[aria-label*="Singles Inferno S5"]').filter({ hasText: '👩' })
    await womenBoardAfterReload.click()
    await page.waitForTimeout(1000)

    // Take screenshot after reload
    await page.screenshot({ path: 'e2e/screenshots/07-after-reload.png', fullPage: true })

    // Verify the edit persisted
    const reloadedCards = page.locator('[data-testid="rank-card"]')
    await expect(reloadedCards.first()).toBeVisible({ timeout: 5000 })
    const reloadedText = await reloadedCards.first().textContent()
    console.log('First card text after reload:', reloadedText)
    expect(reloadedText).toContain('(edited)')

    console.log('All tests passed!')
    console.log(`- Both boards created: ✓`)
    console.log(`- Women's board has 6 cards: ✓`)
    console.log(`- Card edit persisted after save: ✓`)
    console.log(`- Card edit persisted after reload: ✓`)
  })
})
