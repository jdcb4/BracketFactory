# Local setup

Requirements: Node 20+ (LTS recommended), npm.

```bash
npm install
npm run dev
```

Open the URL Vite prints (with this repo’s `base`, use `/BracketFactory/` on the dev server).

## Commands

| Command        | Purpose                |
|----------------|------------------------|
| `npm run dev`  | Vite dev server        |
| `npm run build`| Typecheck + production build + `404.html` |
| `npm test`     | Vitest unit tests      |
| `npm run lint` | ESLint                 |
| `npm run test:e2e` | Playwright (run `npm run build` first) |
