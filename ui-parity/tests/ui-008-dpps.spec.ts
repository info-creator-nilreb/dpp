/**
 * UI-008: DPP-Liste – Visuelle Regression
 * Route: /app/dpps | CAP-010 | API-041
 * HINWEIS: Seite ist Server-Rendered. Benötigt laufende App + Auth + Seed-Daten.
 * Alternativ: Fixture in prisma/seed.ts für parity-test@example.com
 */
import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
] as const

test.describe('UI-008 DPP-Liste', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement.style.setProperty('animation-duration', '0s')
      document.documentElement.style.setProperty('transition-duration', '0s')
    })
  })

  /* HINWEIS: Benötigt Auth + Seed. Für CI: storageState mit Login oder parity-test@example.com in DB */

  for (const vp of VIEWPORTS) {
    test(`[${vp.name}] DPP-Liste - success`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/app/dpps', { waitUntil: 'networkidle' })
      await expect(page).toHaveScreenshot(`UI-008-dpps-success-${vp.name}.png`, {
        maxDiffPixelRatio: 0.02,
      })
    })
  }
})
