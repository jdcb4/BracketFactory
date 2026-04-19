# Contributing bracket templates and generators

BracketFactory splits each “bracket family” into two parts that must stay in sync:

1. **Template JSON** (`templates/<id>.json`) — catalog metadata, UI parameters, defaults, and preview camera. Loaded at build time (`src/registry/loadTemplates.ts`).
2. **Generator** (`src/generators/*.ts`) — JSCAD code that turns parameter values into a `geom3` solid. Selected by `generationStrategy` via `generateFromStrategy` in `src/generators/registry.ts`.

A contribution is complete only when both sides match: parameter names and types in JSON line up with what the registry reads and passes into the generator.

---

## Path A — New catalog entry, existing geometry

Use this when you only need another preset (dimensions, copy, category) for a **strategy that already exists** in `registry.ts` (for example `flatPlate`, `lBracket`).

1. Copy a similar file under `templates/` (e.g. `flat-plate.json`).
2. Set a unique `id` (kebab-case) and update `name`, `description`, `category`, `version`, and `preview` as needed.
3. Keep `generationStrategy` unchanged unless you are also doing Path B.
4. Adjust `parameters` so the keys match what the registry passes for that strategy (see existing templates and the `case` in `registry.ts` for that strategy).
5. Run `npm test` (JSON schema + generator smoke tests).
6. Run `npm run dev`, open the template in the app, export STL, and sanity-check in a slicer.
7. Optional: add or refresh `thumbnail` per `templates/README.md`.

---

## Path B — New or changed geometry (new `generationStrategy`)

Use this when you need **new shapes** or **new parameters** that the current switch cases do not support.

### 1. Pick a strategy id

- Use a **camelCase** string, e.g. `flatPlate`, `lBracket`. This is the value of `generationStrategy` in JSON and a `case` label in `registry.ts`.
- Prefer **one generator module per strategy** (e.g. `flatPlate.ts` exports `generateFlatPlate`), unless you intentionally alias (e.g. `cornerBracket` → same generator as `lBracket`).

### 2. Implement the generator

- Add `src/generators/<yourModule>.ts`.
- Export a function that returns a JSCAD **`Geom3`** (see `@jscad/modeling`). Existing examples: `generateFlatPlate`, `generateLBracket`, `generateUChannel`, `generateShelfBracket`, `generateFrenchCleat`, `generatePipeSaddleClamp`.
- **Reuse shared geometry** where it fits:
  - Holes, slots, countersinks: `src/geometry/holeOps.ts`, `src/geometry/holeLayout.ts`.
  - Other parts of the codebase follow the same patterns as sibling generators.
- **Orientation**: keep the print bed consistent with other families (e.g. many parts sit with a sensible face on **z = 0** — match an existing generator’s convention).

### 3. Wire the registry

In `src/generators/registry.ts`:

1. **Import** your `generate…` function.
2. Add a **`case 'yourStrategy':`** branch that:
   - Reads from the `ParamRecord` using `num`, `int`, `bool` (and narrow string unions where needed, e.g. `cleatType` or `style`).
   - Maps JSON parameter keys to your function’s **typed options object**.
3. Understand **`prepareGeneratorParams`** (called before the switch): it resolves bolt presets to `holeDiameter` / `countersinkIncludedAngleDeg` and strips UI-only keys (`processId`, `mountingBolt`). Do not rely on those stripped keys inside the generator.

If you add **new parameter keys**, update the template JSON and, when needed, **`templates/_schema.json`** so all templates stay valid (see `templates/README.md`).

### 4. Tests

- Extend `src/generators/generators.test.ts`: add your strategy to the list so `generateFromStrategy(strategy, {})` produces a non-empty `geom3`.
- Run `npm test`.

### 5. Template JSON and UI

- Add or update `templates/<id>.json` with `generationStrategy: "yourStrategy"` and a `parameters` array consistent with the registry mapping.
- Run the app and verify sliders/inputs and export.

### 6. Optional thumbnail

Follow `templates/README.md` if the catalog should show a PNG.

---

## Quick reference

| Concern | Where |
|--------|--------|
| Template fields and schema | `docs/template-spec.md`, `templates/_schema.json` |
| Strategy → code | `src/generators/registry.ts` |
| JSCAD implementations | `src/generators/*.ts` |
| Preview / export pipeline | `docs/architecture.md` |
| Validation / print warnings | `docs/validation-rules.md`, `src/validation/` |

---

## Checklist before opening a PR

- [ ] `npm test` passes (schema + generators).
- [ ] New or changed strategy has a **registry** branch and **test** coverage in `generators.test.ts`.
- [ ] Template JSON `parameters` match the keys the registry reads.
- [ ] Manual check: preview and STL look correct for a few parameter combinations.

See also `templates/README.md`.
