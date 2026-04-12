# Architecture

## Flow

1. **Templates** — `import.meta.glob` in `src/registry/loadTemplates.ts` pulls every `templates/*.json` at build time.
2. **Routing** — `HashRouter` so deep links work on GitHub Pages without server rewrite (path is in the hash).
3. **Configuration UI** — `BracketConfigPage` resolves the template id, then mounts `BracketConfigurator` only when a template exists (keeps hook count stable).
4. **Geometry** — `generationStrategy` in JSON maps to `generateFromStrategy` in `src/generators/registry.ts` (typed JSCAD per family).
5. **Preview** — `geom3` → `geom3ToBufferGeometry` → Three.js mesh (`src/geometry/jscadToThree.ts`).
6. **Export** — same `geom3` passed to `@jscad/stl-serializer` (`src/geometry/stlExport.ts`).

## Holes & features

- Through-holes, optional **capsule slots** (hull of two cylinders), and **countersinks** are implemented in `src/geometry/holeOps.ts`. Countersink direction follows typical screw entry (e.g. outside face on vertical legs; both faces on plate thickness along Z).
- The **angle bracket** template (`l-bracket`) includes optional **gussets** (extruded triangular prisms) in the same generator as the plain L (`src/generators/lBracket.ts`). Legacy routes `corner-bracket` and `gusseted-corner` redirect to `l-bracket`.

## Catalog thumbnails

- PNG previews under `public/thumbnails/{template-id}.png` are generated from the same Three.js viewport as the app. After `npm run build`, run `npm run preview` in one terminal and `npm run thumbnails` in another (see `scripts/capture-thumbnails.mjs`).

## Build output

- `npm run build` produces `dist/`; `scripts/copy-404.mjs` copies `index.html` to `404.html` for optional direct-URL hosting patterns.
