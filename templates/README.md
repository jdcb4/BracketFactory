# Template files

- Add new templates as `*.json` next to this README.
- Validate against `templates/_schema.json` (`npm test` runs Ajv on every file).
- Do not edit `_schema.json` unless you intend to change the contract for all templates.

Each template’s `generationStrategy` must exist in `src/generators/registry.ts` and must be implemented by a generator under `src/generators/` (see **`docs/template-contributor-guide.md`** for JSON + code + tests).

## Thumbnail images

Optional `thumbnail` field: path under `public/`, e.g. `thumbnails/l-bracket.png`.

Regenerate PNGs from the live preview after changing geometry or camera defaults:

1. `npm run build` then `npm run preview` (default port 4173).
2. In another shell: `npm run thumbnails` (sets `THUMBNAIL_BASE_URL` if needed).

This runs `scripts/capture-thumbnails.mjs` (Playwright) and overwrites `public/thumbnails/*.png`.
