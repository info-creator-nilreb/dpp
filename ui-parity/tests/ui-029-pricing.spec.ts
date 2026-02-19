/**
 * UI-029: Pricing – Visuelle Regression
 * Route: /pricing | CAP-027 | API-097
 * Öffentliche Seite. Hinweis: Server-rendered, Inhalt abhängig von DB/Seed.
 */
import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
] as const

test.describe('UI-029 Pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement.style.setProperty('animation-duration', '0s')
      document.documentElement.style.setProperty('transition-duration', '0s')
    })
  })

  for (const vp of VIEWPORTS) {
    test(`[${vp.name}] Pricing-Seite`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/pricing', { waitUntil: 'networkidle' })
      await expect(page.locator('body')).toBeVisible()
      await expect(page).toHaveScreenshot(`UI-029-pricing-${vp.name}.png`, {
        maxDiffPixelRatio: 0.03,
      })
    })
  }
})
