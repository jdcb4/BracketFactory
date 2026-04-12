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
