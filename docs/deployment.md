# Deployment (GitHub Pages)

## Repository settings

1. **Settings → Pages → Build and deployment**: set **Source** to **GitHub Actions** (not “Deploy from a branch” for the artifact flow described here).
2. Enable **Pages** write permission for Actions (default for `GITHUB_TOKEN` in the provided workflow).

## Workflow

`.github/workflows/deploy.yml` runs on every push to `main` and on `workflow_dispatch`. It:

1. Installs dependencies with `npm ci`.
2. Runs `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
3. Runs Playwright against the built `dist/` preview.
4. Uploads `dist/` and deploys with `actions/deploy-pages`.

## Vite base path

`vite.config.ts` sets `base: '/BracketFactory/'` for project Pages at `https://jdcb4.github.io/BracketFactory/`. For a user/org root site or custom domain, change `base` to `/` or your path and adjust links accordingly.

## SPA fallback

`404.html` is a copy of `index.html` so hosts that serve `404.html` for unknown paths still load the app. Hash-based routing avoids needing rewrites for bracket URLs.
