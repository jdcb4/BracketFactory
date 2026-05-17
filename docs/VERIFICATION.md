# Verification

Run these deterministic checks before commit:

```bash
pnpm run typecheck
pnpm test
pnpm run lint
pnpm run build
```

The combined gate is also exposed as:

```bash
pnpm run verify
```

For significant implementation changes, run Fallow and consider its feedback before final verification:

```bash
pnpm dlx fallow --no-cache --format human
```

If Fallow is unavailable, record that it was skipped and perform a local code-quality review before running the deterministic checks.

Fallow config lives in `.fallowrc.json`. Fallow 2.x uses the keys `entry` and `ignorePatterns`.

## Optional deeper checks

When investigating dead code, duplication, or unused dependencies:

```bash
pnpm dlx ts-prune
pnpm dlx knip
pnpm dlx jscpd .
```

These may report false positives for framework entrypoints, plugin-loaded files, or runtime-only dependencies. Document false positives near the relevant config or in this file.

## Preset-specific checks

- `pnpm run build:pages` - required for changes affecting GitHub Pages base-path behavior.

## Environment

Use Node.js 22 LTS (see `.nvmrc`) and pnpm 9+.
