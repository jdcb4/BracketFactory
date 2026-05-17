# Agent Instructions — DefaultProjectStructure

This file holds the rules an agent must obey **on every turn**. Detailed reference material (deterministic tools, deep modularity rules, dependency policy) lives in `docs/AGENT_REFERENCE.md` — load it on demand, not by default.

## Project shape

- Preset: `client-only`
- Deploy targets: GitHub Pages, preferablly as a signle page web app that can also be run compeltely locally from file system.
- Stack defaults: TypeScript strict, pnpm, Vite, ESLint + Prettier, Vitest + RTL, Zod, Tailwind
- Persistence default: JSON files. Use Drizzle + SQLite/Postgres only when JSON is no longer suitable, and document the move in `docs/DECISIONS.md`.
- Auth: **do not implement auth** unless the user explicitly asks for it.

## First-step orientation

Before making changes:

1. Read this file.
2. Read `docs/PROJECT_INDEX.md`.
3. Read any docs relevant to the files being changed.
4. Inspect `package.json` scripts before inventing commands.
5. Prefer existing patterns over new abstractions.

If docs are missing, stale, or inconsistent with the code, fix them as part of the change.

## Hard rules

1. **No auth without explicit request.** If a task seems to need auth, surface that as a question rather than building it.
2. **No new top-level dependency or framework** without a `docs/DECISIONS.md` entry recording why.
3. **No new database** without first justifying why JSON files are insufficient. Document the decision.
4. **Run deterministic checks before claiming a task is complete.** See `docs/VERIFICATION.md`. Never claim a check passed when it did not.
5. **Bump the version on every behaviour-affecting change** per `docs/VERSIONING.md`, and update `docs/CHANGELOG.md`. If the change is version-neutral, say so explicitly in the commit message.
6. **Do not implement roadmap items unless the user moves them into active work.** Out-of-scope ideas go into `docs/ROADMAP.md`.
7. **Do not commit secrets, build output, `node_modules`, or local env files.** See `.gitignore` and `SECURITY.md`.
8. **Do not weaken or skip tests to make them pass.** Fix the underlying issue.
9. **Local dev is Windows PowerShell.** When running shell commands locally use PowerShell syntax (no `&&`/`||` chains, env vars are `$env:NAME`, line continuation is backtick). CI and Docker run on Linux bash — that's fine, just don't conflate the two. Cheatsheet in `docs/AGENT_REFERENCE.md`.
10. **Use design tokens, not raw Tailwind classes.** Visual style — colour, font size, font weight, tracking, radii — flows through `src/styles/tokens.css` and the primitives in `src/components/ui/typography.tsx` and `src/components/ui/surface.tsx`. In feature code: write `<Heading level={2}>`, `<Body>`, `<Surface variant="raised">`, `bg-surface-base`, `text-text-secondary`. Do NOT write `text-3xl`, `font-semibold`, `tracking-tight`, `bg-blue-500`, `text-neutral-400`, hex colours, or raw rem sizes. Layout utilities (`flex`, `gap-4`, `px-6`, `min-h-dvh`) are fine. Add new tokens to `tokens.css` first, expose them in `tailwind.config.ts`, then use. See `docs/DESIGN_TOKENS.md`.

## Deterministic checks before commit

```bash
pnpm run typecheck
pnpm test
pnpm run lint
pnpm run build
```

For significant implementation changes, also run Fallow and consider its feedback:

```bash
pnpm dlx fallow --no-cache --format human
```

`docs/VERIFICATION.md` lists preset-specific extra checks (Docker build, deploy preview, etc.).

## Documentation and Human-Facing Artifacts

- Documentation that is likely to be read by an agent, or that is central to the ongoing maintenance of the repo, should remain in Markdown.
  - Examples: `AGENTS.md`, architecture notes, implementation plans, repo conventions, changelogs, and technical decision records.

- Human-facing artifacts, especially temporary or review-oriented artifacts, should usually be created as HTML.
  - Examples: UX proposals, app flow outlines, feature walkthroughs, visual explanations, prototypes, and approach summaries.
  - Use HTML interactivity where helpful, such as collapsible sections, embedded images, diagrams, lightweight prototypes, or simple navigation.
  - Keep these HTML artifacts useful and readable without making them unnecessarily complex.

## UX-First Implementation

- Prioritise UX before significant implementation work.
- For substantial features, present UX options or a lightweight UX outline before committing to implementation.
- Where appropriate, include screens, user flows, interaction states, and trade-offs for review.
- Do not jump straight into major implementation unless the UX direction is already clear or has been approved.

## Documentation map

- `docs/PROJECT_INDEX.md` — entry point: folders, commands, key docs.
- `docs/ARCHITECTURE.md` — module boundaries and runtime shape.
- `docs/VERIFICATION.md` — required deterministic checks.
- `docs/VERSIONING.md` — version rules.
- `docs/DECISIONS.md` — durable decisions (ADR-lite).
- `docs/ROADMAP.md` — future ideas only.
- `docs/CHANGELOG.md` — notable changes by version.
- `docs/DEPLOYMENT.md` — deploy instructions.
- `docs/AGENT_REFERENCE.md` — detailed agent reference (load when relevant).
- `docs/AGENT_PROMPTS.md` — canonical re-usable task prompts.
- `docs/DESIGN_TOKENS.md` — colour, type, and layout token system.

## When blocked

If a task cannot be completed cleanly:

1. Make the smallest safe improvement available.
2. Document what remains blocked and why.
3. Include exact commands run and exact failures.
4. Do not claim checks passed unless they were run successfully.
