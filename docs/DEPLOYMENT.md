# Deployment - BracketFactory

BracketFactory is a static browser app. No server-side state, database, API, or auth layer is deployed.

## Local development

```bash
pnpm run dev
```

## Local production preview

```bash
pnpm run build
pnpm run preview
```

`pnpm run build` writes the static app to `dist`.

## GitHub Pages

The Pages base path is set in `vite.config.ts` and currently uses `/BracketFactory2/`. The Pages URL will be:

```text
https://<your-github-username>.github.io/BracketFactory2/
```

Repository setup:

1. Push the project to GitHub. The repository name must match the Pages base path above.
2. Open `Settings -> Pages`.
3. Set `Build and deployment` source to `GitHub Actions`.
4. Push to `main` or run the workflow manually after one is added.

If the GitHub repository is renamed, update the `base` value in `vite.config.ts` to match and run:

```bash
pnpm run build:pages
```

## Verification before deploy

```bash
pnpm run verify
pnpm run build:pages
```
