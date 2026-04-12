import { test, expect } from '@playwright/test'

test('bracket page loads and STL downloads', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/BracketFactory/#/bracket/l-bracket', { waitUntil: 'networkidle' })

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Angle bracket', { timeout: 30_000 })

  const downloadBtn = page.getByTestId('download-stl')
  await expect(downloadBtn).toBeEnabled({ timeout: 45_000 })

  const downloadPromise = page.waitForEvent('download')
  await downloadBtn.click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/l-bracket\.stl$/i)
})

test('catalog lists templates and navigates to a bracket', async ({ page }) => {
  await page.goto('/BracketFactory/#/', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: /template catalog/i })).toBeVisible()

  await Promise.all([
    page.waitForURL(/bracket\/l-bracket/),
    page.getByRole('link', { name: /Angle bracket/i }).first().click(),
  ])

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Angle bracket', { timeout: 15_000 })
})
