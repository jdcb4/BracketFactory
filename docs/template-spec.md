# Template specification

Each file in `templates/` (except `_schema.json`) describes one bracket family.

## Required fields

- `id`, `name`, `description`, `category`, `version`
- `generationStrategy` — must match a switch branch in `src/generators/registry.ts`
- `units` — must be `"mm"`
- `parameters` — array of parameter descriptors (see `_schema.json`)
- `preview` — `cameraPosition` and `target` for the Three.js camera (mm space matches JSCAD output scale)

## Optional

- `disabled`, `disabledReason` — hide or soft-disable a template in the catalog.

Authoritative JSON Schema: `templates/_schema.json`.

## Generator code (TypeScript)

JSON describes *what appears in the catalog and UI*; **geometry is implemented in TypeScript**. Each template’s `generationStrategy` must match a `case` in `src/generators/registry.ts`, which calls a `generate…` function in `src/generators/` (JSCAD `geom3`).

For a full walkthrough—adding only JSON vs adding a new strategy, wiring `registry.ts`, tests, and checks—see **`docs/template-contributor-guide.md`**.
