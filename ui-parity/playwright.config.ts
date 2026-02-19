import { defineConfig, devices } from '@playwright/test'

/**
 * UI-Parität – Visuelle Regressionstests
 * Modi: UI_PARITY_RECORD=1 (Baseline), sonst compare
 */
export default defineConfig({
  updateSnapshots: process.env.UI_PARITY_RECORD === '1' ? 'all' : 'none',
  testDir: './tests',
  outputDir: './reports/test-results',
  snapshotDir: './reports/snapshots',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: './reports/html', open: 'never' }],
    ['json', { outputFile: './reports/results.json' }],
  ],
  use: {
    baseURL: process.env.UI_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { ...devices['iPad Pro'], viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } } },
  ],
})
