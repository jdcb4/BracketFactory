# Decisions

Durable architecture and tooling decisions for BracketFactory. ADR-lite format: each entry is dated, names the decision, the reasoning, and any rejected alternatives.

When adding a new entry, append to the bottom and keep the most recent decisions visible. Do not delete past decisions; supersede them with a new entry that links back.

## Format

```
## YYYY-MM-DD: <decision title>

**Decision:** <one sentence>

**Reasoning:** <why this won>

**Rejected alternatives:** <what else was considered and why not>

**Supersedes:** <link to a prior decision, if applicable>
```

---

## 2026-01-01: Scaffolded from the `client-only` preset

**Decision:** Use the `Client-only React app` defaults from the Project Initiation base.

**Reasoning:** Matches the project's expected shape for GitHub Pages. Keeps tooling consistent with other projects scaffolded from the same base, reducing context-switching and giving agents predictable structure.

**Rejected alternatives:** Alternative presets in the base were not chosen because they target different deployment shapes or backend requirements.

## 2026-05-16: Generate bracket solids with JSCAD in the browser

**Decision:** Use `@jscad/modeling` for browser-side bracket geometry and `@jscad/stl-serializer` plus `@jscad/3mf-serializer` for print exports.

**Reasoning:** JSCAD gives deterministic constructive solid geometry in TypeScript-friendly browser code, which fits a client-only GitHub Pages app and allows the same generated solid to drive preview and downloads. The serializer packages provide direct STL and 3MF output without adding a server-side export step.

**Rejected alternatives:** Three.js-only mesh construction was rejected because it would make constraint-driven solid modeling and watertight export more error-prone. Server-side CAD generation was rejected because the MVP is explicitly client-only.

## 2026-05-16: Use token primitives with lucide icons for the wizard UI

**Decision:** Build the first wizard UI from local token-driven primitives and `lucide-react` icons instead of introducing a larger component framework.

**Reasoning:** The project rules require design tokens and the MVP needs only a focused set of controls. Local primitives keep styling inspectable while lucide supplies recognizable action icons for wizard steps and exports.

**Rejected alternatives:** Pulling in a full UI kit was rejected for the initial scaffold because it would add more surface area than the MVP needs. Hand-drawn SVG icons were rejected because lucide is already the preferred icon source for this project style.

## 2026-05-16: Render bracket previews with Three.js

**Decision:** Use `three` and `OrbitControls` for interactive browser previews of generated JSCAD solids.

**Reasoning:** The initial 2D canvas projection made boolean geometry look jagged and could not support rotation. Three.js provides a proven WebGL renderer, camera controls, lighting, and mesh display while leaving JSCAD responsible for the watertight printable model.

**Rejected alternatives:** Continuing the hand-written 2D projection was rejected because it could not meet the rotation requirement or provide reliable visual inspection. React Three Fiber was rejected for now because the app only needs one bounded viewer and direct Three.js keeps the dependency surface smaller.
