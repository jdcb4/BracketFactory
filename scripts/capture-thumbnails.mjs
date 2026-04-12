/**
 * Renders catalog thumbnails from the live Three.js preview (same view as the app).
 *
 * Prerequisites: `npm run build` then `npm run preview` (default http://127.0.0.1:4173).
 * Usage: `node scripts/capture-thumbnails.mjs`
 * Optional: `THUMBNAIL_BASE_URL=http://127.0.0.1:4173` `VITE_BASE_PATH=/BracketFactory/`
 */

import { chromium } from '@playwright/test'
import fs from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const templatesDir = join(root, 'templates')

const baseUrl = process.env.THUMBNAIL_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:4173'
const basePath = process.env.VITE_BASE_PATH ?? '/BracketFactory/'

const ids = fs
  .readdirSync(templatesDir)
  .filter((f) => f.endsWith('.json') && f !== '_schema.json')
  .map((f) => JSON.parse(fs.readFileSync(join(templatesDir, f), 'utf-8')).id)

async function run() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  for (const id of ids) {
    const url = `${baseUrl}${basePath.replace(/\/$/, '')}/#/bracket/${id}`
    process.stderr.write(`Capturing ${id} … ${url}\n`)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.getByTestId('preview-viewport').locator('canvas').waitFor({ state: 'visible', timeout: 45_000 })
    await page.waitForTimeout(1200)
    const out = join(root, 'public', 'thumbnails', `${id}.png`)
    await page.getByTestId('preview-viewport').screenshot({ path: out, type: 'png' })
  }

  await browser.close()
  process.stderr.write('Done.\n')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
