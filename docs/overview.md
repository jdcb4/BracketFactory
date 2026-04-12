# BracketFactory — overview

BracketFactory is a static, client-only web app for generating parametric, 3D-printable brackets. Geometry is built with JSCAD in the browser, previewed with Three.js, and exported as binary STL. Templates are JSON files in the `templates/` folder, loaded at build time.

## MVP scope

- Catalog of MVP bracket families (L-bracket, gusseted corner, flat plate, U-channel, extrusion).
- Per-template parameters, validation hints, and printability warnings.
- Live preview and STL download (same geometry for both).

## Assumptions

- Units in the UI are millimetres (mm).
- GitHub Pages URL uses Vite `base` `/BracketFactory/` (project site).
- Imperial fastener presets convert to mm via `src/data/fasteners.ts`.
