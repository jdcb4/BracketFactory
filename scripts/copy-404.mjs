/**
 * GitHub Pages serves 404.html for unknown paths; copy SPA shell so client routes work on refresh.
 */
import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist', 'index.html')
const out = join(root, 'dist', '404.html')

if (!existsSync(dist)) {
  console.error('Missing dist/index.html — run vite build first.')
  process.exit(1)
}
copyFileSync(dist, out)
console.log('Wrote dist/404.html (SPA fallback for GitHub Pages).')
