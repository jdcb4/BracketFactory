# Decisions

## JSCAD + Three.js + STL

Single pipeline: `@jscad/modeling` for solids, Three.js for preview, `@jscad/stl-serializer` for export. No second geometry path.

## Hash routing

`HashRouter` keeps GitHub Pages deep links reliable without server configuration. Catalog and bracket routes live under `#/…`.

## Pure geometry memo

An early version called `setState` inside `useMemo` while building JSCAD geometry. That violated React purity and surfaced as **React error #301** in production. Geometry and error strings are now computed together in a **pure** `useMemo` returning `{ geometry, geomError }`.

## Zod and forms

Template JSON is validated in CI with Ajv (`templates/_schema.json`). Runtime forms use `react-hook-form` with defaults from the template; a `zodResolver` was removed after resolver/type friction with Zod 4. Stricter per-field Zod can be reintroduced behind a dedicated child component or `onSubmit` validation without touching the geometry memo.

## STL serializer API

`serialize({ binary: true }, geom)` takes the **geom3 object**, not `[geom]`. Passing an array produced an 80-byte blob (header only).
