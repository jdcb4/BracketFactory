# Project Index - BracketFactory

The first stop for navigating this project.

## What this project is

BracketFactory is a client-only React app for generating constrained, 3D-printable brackets in the browser. The MVP supports flat L, U, and angle bracket wizards that build JSCAD geometry locally, preview the generated solid in an interactive Three.js viewer, and export STL or 3MF files.

## Important folders

- `src/app` - app shell and top-level orchestration.
- `src/features/bracket-wizard` - guided bracket generator UI and local preview.
- `src/components/ui` - token-driven reusable visual primitives.
- `src/domain/brackets` - framework-independent bracket rules, constraints, geometry generation, and export helpers.
- `src/lib` - small generic helpers.
- `src/styles` - semantic design tokens and global CSS.
- `src/tests` - shared test setup.
- `docs` - durable project documentation and human-facing UX artifacts.
- `input` - reference 3MF and bracket-language image supplied by the user.
- `scripts` - deterministic project utility scripts.

## Commands

| Command                | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `pnpm run dev`         | Start the development server.                 |
| `pnpm run typecheck`   | TypeScript checking.                          |
| `pnpm run lint`        | ESLint.                                       |
| `pnpm test`            | Vitest once.                                  |
| `pnpm run test:watch`  | Vitest in watch mode.                         |
| `pnpm run build`       | Production build using the configured base.   |
| `pnpm run build:pages` | Production build with GitHub Pages base path. |
| `pnpm run verify`      | Typecheck + lint + test + build commit gate.  |
| `pnpm dlx fallow ...`  | Dead-code, complexity, and duplication scan.  |

## Key docs

- [`AGENTS.md`](../AGENTS.md) - the every-turn agent ruleset.
- [`docs/AGENT_REFERENCE.md`](AGENT_REFERENCE.md) - detailed agent reference.
- [`docs/AGENT_PROMPTS.md`](AGENT_PROMPTS.md) - canonical re-usable task prompts.
- [`docs/DESIGN_TOKENS.md`](DESIGN_TOKENS.md) - colour, type, and layout token system.
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) - module boundaries and runtime shape.
- [`docs/VERIFICATION.md`](VERIFICATION.md) - required checks before commit.
- [`docs/VERSIONING.md`](VERSIONING.md) - version rules.
- [`docs/DECISIONS.md`](DECISIONS.md) - durable decisions.
- [`docs/ROADMAP.md`](ROADMAP.md) - future ideas only, not active work.
- [`docs/CHANGELOG.md`](CHANGELOG.md) - notable changes by version.
- [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) - deploy instructions.
- [`docs/ux-bracketfactory-mvp.html`](ux-bracketfactory-mvp.html) - MVP wizard UX outline.
- [`SECURITY.md`](../SECURITY.md) - security rules.
