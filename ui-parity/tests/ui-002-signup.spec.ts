/**
 * UI-002: Signup – Visuelle Regression
 * Route: /signup | CAP-002 | FLOW-002
 */
import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
] as const

test.describe('UI-002 Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement.style.setProperty('animation-duration', '0s')
      document.documentElement.style.setProperty('transition-duration', '0s')
    })
  })

  for (const vp of VIEWPORTS) {
    test(`[${vp.name}] Signup-Formular - empty state`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/signup', { waitUntil: 'networkidle' })
      await expect(page.getByRole('heading', { name: /Jetzt kostenlos registrieren|Registrier/i })).toBeVisible({ timeout: 10000 })
      await expect(page).toHaveScreenshot(`UI-002-signup-empty-${vp.name}.png`, {
        maxDiffPixelRatio: 0.02,
      })
    })
  }
})
