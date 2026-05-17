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

GitHub Pages deployment is handled by `.github/workflows/deploy-pages.yml`.
The workflow runs on every push to `master` and can also be started manually
from the GitHub Actions tab.

The Pages build uses the repository base path `/BracketFactory/`. The Pages URL
will be:

```text
https://<your-github-username>.github.io/BracketFactory/
```

Repository setup:

1. Push the project to GitHub as `BracketFactory`.
2. Open `Settings -> Pages`.
3. Set `Build and deployment` source to `GitHub Actions`.
4. Push a commit to `master`, or run `Deploy GitHub Pages` manually from
   `Actions`.

If the GitHub repository is renamed, update the `build:pages` base path in
`package.json` to match and run:

```bash
pnpm run build:pages
```

## Verification before deploy

```bash
pnpm run verify
pnpm run build:pages
```
