# Validation rules (engineering)

Rules are implemented in `src/validation/` and `src/data/processes.ts`. Highlights:

- **Walls** — process presets include minimum supported/unsupported wall thicknesses.
- **Bridges** — warn above ~10 mm unsupported span (`BRIDGE_WARN_MM`).
- **Holes** — edge distance checks vs hole diameter (`bracketChecks.ts`).
- **Flanges** — rule-of-thumb 4× thickness (`flangeTooShort`).
- **Fit presets** — documented in the product prompt; clearance bands can be extended in data modules.

Template JSON `min`/`max` on parameters provide first-line numeric bounds in the UI.
