/**
 * UI-001: Login - Visuelle Regression
 * Route: /login | CAP-001 | FLOW-001
 */
import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
] as const

test.describe('UI-001 Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement.style.setProperty('animation-duration', '0s')
      document.documentElement.style.setProperty('transition-duration', '0s')
    })
  })

  for (const vp of VIEWPORTS) {
    test(`[${vp.name}] Login-Formular - success state`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/login', { waitUntil: 'networkidle' })
      await expect(page.getByRole('heading', { name: /Willkommen zurück/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Anmelden/i })).toBeVisible()
      await expect(page).toHaveScreenshot(`UI-001-login-success-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      })
    })
  }

  test('Login - empty state', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/login', { waitUntil: 'networkidle' })
    await expect(page.getByRole('button', { name: /Anmelden/i })).toBeVisible()
    await expect(page).toHaveScreenshot('UI-001-login-empty-desktop.png', { maxDiffPixelRatio: 0.01 })
  })
})
