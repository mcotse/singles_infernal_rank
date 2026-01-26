import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173/singles_infernal_rank/'

// Timeout constants for consistent wait times
const TIMEOUTS = {
  /** Short wait for UI transitions and state updates */
  SHORT: 300,
  /** Standard wait for navigation and simple operations */
  STANDARD: 500,
  /** Long wait for async operations like auth and profile creation */
  LONG: 1000,
} as const

/**
 * E2E tests for social authentication features
 * Uses mock auth (no Firebase required)
 */
test.describe('Social Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all auth data before each test
    await page.goto(BASE_URL)
    await page.evaluate(() => {
      localStorage.removeItem('mock-auth-user')
      localStorage.removeItem('mock-user-profiles')
      localStorage.removeItem('mock-usernames')
    })
    await page.reload()
    await page.waitForTimeout(TIMEOUTS.STANDARD)
  })

  test('should show sign-in prompt on Friends page when not authenticated', async ({ page }) => {
    // Navigate to Friends tab
    const friendsTab = page.locator('button:has-text("Friends")')
    await friendsTab.click()
    await page.waitForTimeout(TIMEOUTS.STANDARD)

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/social-01-sign-in-prompt.png', fullPage: true })

    // Verify sign-in prompt elements
    await expect(page.locator('text=Sign In to Connect')).toBeVisible()
    await expect(page.locator('text=Sign in with Google')).toBeVisible()

    // Verify dev mode indicator is shown
    await expect(page.locator('text=Dev Mode')).toBeVisible()

    console.log('Sign-in prompt displayed correctly')
  })

  test('should complete full sign-in and username setup flow', async ({ page }) => {
    // Navigate to Friends tab
    const friendsTab = page.locator('button:has-text("Friends")')
    await friendsTab.click()
    await page.waitForTimeout(TIMEOUTS.STANDARD)

    // Click sign in button
    const signInButton = page.locator('button:has-text("Sign in with Google")')
    await expect(signInButton).toBeVisible()
    await signInButton.click()

    // Wait for mock auth to complete and modal to appear
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Take screenshot of username modal
    await page.screenshot({ path: 'e2e/screenshots/social-02-username-modal.png', fullPage: true })

    // Verify username setup modal appears
    await expect(page.locator('text=Choose Your Username')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=This is how friends will find you')).toBeVisible()

    // Enter a username
    const usernameInput = page.locator('input[placeholder*="ranking_queen"]')
    await expect(usernameInput).toBeVisible()
    await usernameInput.fill('test_user_123')

    // Take screenshot with username entered
    await page.screenshot({ path: 'e2e/screenshots/social-03-username-entered.png', fullPage: true })

    // Click Continue button
    const continueButton = page.locator('button:has-text("Continue")')
    await continueButton.click()

    // Wait for profile creation
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Take screenshot of friends page
    await page.screenshot({ path: 'e2e/screenshots/social-04-signed-in.png', fullPage: true })

    // Verify we're on the friends page with username
    await expect(page.locator('h1:has-text("Friends")')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=@test_user_123')).toBeVisible()

    // Verify "Coming Soon" placeholder is shown
    await expect(page.locator('text=Coming Soon')).toBeVisible()

    console.log('Full sign-in flow completed successfully')
  })

  test('should persist auth state after page reload', async ({ page }) => {
    // First, complete sign-in flow
    const friendsTab = page.locator('button:has-text("Friends")')
    await friendsTab.click()
    await page.waitForTimeout(TIMEOUTS.STANDARD)

    const signInButton = page.locator('button:has-text("Sign in with Google")')
    await signInButton.click()
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Set username
    const usernameInput = page.locator('input[placeholder*="ranking_queen"]')
    await usernameInput.fill('persist_test_user')
    const continueButton = page.locator('button:has-text("Continue")')
    await continueButton.click()
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Verify signed in
    await expect(page.locator('text=@persist_test_user')).toBeVisible()

    // Reload the page
    await page.reload()
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Navigate back to Friends tab
    await friendsTab.click()
    await page.waitForTimeout(TIMEOUTS.STANDARD)

    // Take screenshot after reload
    await page.screenshot({ path: 'e2e/screenshots/social-05-after-reload.png', fullPage: true })

    // Verify still signed in with same username
    await expect(page.locator('h1:has-text("Friends")')).toBeVisible()
    await expect(page.locator('text=@persist_test_user')).toBeVisible()

    console.log('Auth state persisted after reload')
  })

  test('should show validation error for invalid username', async ({ page }) => {
    // Navigate to Friends tab and sign in
    const friendsTab = page.locator('button:has-text("Friends")')
    await friendsTab.click()
    await page.waitForTimeout(TIMEOUTS.STANDARD)

    const signInButton = page.locator('button:has-text("Sign in with Google")')
    await signInButton.click()
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Wait for modal
    await expect(page.locator('text=Choose Your Username')).toBeVisible()

    // Try too short username
    const usernameInput = page.locator('input[placeholder*="ranking_queen"]')
    await usernameInput.fill('ab')
    const continueButton = page.locator('button:has-text("Continue")')
    await continueButton.click()
    await page.waitForTimeout(TIMEOUTS.SHORT)

    // Take screenshot of validation error
    await page.screenshot({ path: 'e2e/screenshots/social-06-validation-error.png', fullPage: true })

    // Verify validation error appears
    await expect(page.locator('[role="alert"]')).toBeVisible()

    // Fix the username
    await usernameInput.fill('valid_user_name')
    await continueButton.click()
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Verify it works now
    await expect(page.locator('text=@valid_user_name')).toBeVisible()

    console.log('Username validation working correctly')
  })

  test('should prevent duplicate usernames', async ({ page }) => {
    // First, create a user with a specific username
    const friendsTab = page.locator('button:has-text("Friends")')
    await friendsTab.click()
    await page.waitForTimeout(TIMEOUTS.STANDARD)

    let signInButton = page.locator('button:has-text("Sign in with Google")')
    await signInButton.click()
    await page.waitForTimeout(TIMEOUTS.LONG)

    let usernameInput = page.locator('input[placeholder*="ranking_queen"]')
    await usernameInput.fill('unique_name')
    let continueButton = page.locator('button:has-text("Continue")')
    await continueButton.click()
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Verify first user signed in
    await expect(page.locator('text=@unique_name')).toBeVisible()

    // Now simulate a different user trying the same username
    // Clear only the auth user but keep the usernames registry
    await page.evaluate(() => {
      localStorage.removeItem('mock-auth-user')
      localStorage.removeItem('mock-user-profiles')
      // Keep mock-usernames to simulate another user
    })
    await page.reload()
    await page.waitForTimeout(TIMEOUTS.STANDARD)

    // Navigate to Friends and sign in again
    await friendsTab.click()
    await page.waitForTimeout(TIMEOUTS.STANDARD)

    signInButton = page.locator('button:has-text("Sign in with Google")')
    await signInButton.click()
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Try the same username
    usernameInput = page.locator('input[placeholder*="ranking_queen"]')
    await usernameInput.fill('unique_name')
    continueButton = page.locator('button:has-text("Continue")')
    await continueButton.click()
    await page.waitForTimeout(TIMEOUTS.STANDARD)

    // Take screenshot of duplicate error
    await page.screenshot({ path: 'e2e/screenshots/social-07-duplicate-username.png', fullPage: true })

    // Verify duplicate error is shown
    await expect(page.locator('text=already taken')).toBeVisible()

    // Use a different username
    await usernameInput.fill('different_name')
    await continueButton.click()
    await page.waitForTimeout(TIMEOUTS.LONG)

    // Verify it works
    await expect(page.locator('text=@different_name')).toBeVisible()

    console.log('Duplicate username prevention working correctly')
  })
})
