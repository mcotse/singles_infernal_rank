import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173/hot-takes/'

test.describe('CardDetailModal Save Button Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data
    await page.goto(BASE_URL)
    await page.evaluate(() => {
      localStorage.clear()
      indexedDB.deleteDatabase('singles-infernal-rank-images')
    })
    await page.reload()
    await page.waitForTimeout(500)

    // Load seed data
    const settingsTab = page.locator('button:has-text("Settings"), [data-testid="settings-tab"]')
    await settingsTab.click()
    await page.waitForTimeout(300)

    const loadButton = page.locator('button:has-text("Load Cast & Photos")')
    await loadButton.click()
    await page.waitForTimeout(2000)

    // Navigate to boards
    const boardsTab = page.locator('button:has-text("Boards"), [data-testid="boards-tab"]')
    await boardsTab.click()
    await page.waitForTimeout(500)

    // Open women's board
    const womenBoard = page.locator('button[aria-label*="Singles Inferno S5"]').filter({ hasText: '👩' })
    await womenBoard.click()
    await page.waitForTimeout(500)
  })

  test('save button should be visible and clickable without JavaScript workaround', async ({ page }) => {
    // Click on a card to open the edit modal
    const rankCard = page.locator('[data-testid="rank-card"]').first()
    await rankCard.click()
    await page.waitForTimeout(300)

    // Take screenshot before fix verification
    await page.screenshot({ path: 'e2e/screenshots/save-button-test.png', fullPage: true })

    // The save button should be visible in the modal footer
    const saveButton = page.locator('button:has-text("Save Changes")')

    // Check that the button exists and is visible
    await expect(saveButton).toBeVisible({ timeout: 3000 })

    // Check that the button is not covered by other elements (can be clicked without JS workaround)
    // Get the button's bounding box
    const buttonBox = await saveButton.boundingBox()
    expect(buttonBox).not.toBeNull()

    // Verify button is in a reasonable position (not off-screen or hidden)
    expect(buttonBox!.y).toBeGreaterThan(0)
    expect(buttonBox!.height).toBeGreaterThan(20) // Has reasonable height

    // Try to click the button directly (not using page.evaluate workaround)
    // First, fill in a change so we can verify the save worked
    const nameInput = page.locator('input').first()
    const originalName = await nameInput.inputValue()
    await nameInput.fill(originalName + ' [test-save]')

    // Click the save button directly - this should work if the button is truly visible and clickable
    await saveButton.click({ timeout: 3000 })

    // Wait for modal to close
    await page.waitForTimeout(500)

    // Verify modal closed and change was saved
    const updatedCard = page.locator('[data-testid="rank-card"]').first()
    await expect(updatedCard).toContainText('[test-save]')
  })

  test('delete button should also be visible in modal footer', async ({ page }) => {
    // Click on a card to open the edit modal
    const rankCard = page.locator('[data-testid="rank-card"]').first()
    await rankCard.click()
    await page.waitForTimeout(300)

    // The delete button should be visible
    const deleteButton = page.locator('button:has-text("Delete")')
    await expect(deleteButton).toBeVisible({ timeout: 3000 })

    // Verify it's clickable
    const buttonBox = await deleteButton.boundingBox()
    expect(buttonBox).not.toBeNull()
    expect(buttonBox!.height).toBeGreaterThan(20)
  })

  test('modal footer should not be covered by TabBar', async ({ page }) => {
    // Click on a card to open the edit modal
    const rankCard = page.locator('[data-testid="rank-card"]').first()
    await rankCard.click()
    await page.waitForTimeout(300)

    // Get the modal footer (containing save button)
    const saveButton = page.locator('button:has-text("Save Changes")')
    const saveButtonBox = await saveButton.boundingBox()

    // Get the TabBar
    const tabBar = page.locator('nav[aria-label="Main navigation"]')
    const tabBarBox = await tabBar.boundingBox()

    // The save button should be positioned above the tab bar or the tab bar should be hidden/behind
    // If modal has higher z-index, clicking the save button should work
    // This is verified by the ability to click the button directly
    expect(saveButtonBox).not.toBeNull()

    // The save button should either be above the tabbar, or the tabbar should not intercept clicks
    // We verify this by ensuring we can interact with the save button
    await saveButton.click()

    // If we got here without timeout, the button was clickable
    expect(true).toBe(true)
  })
})
