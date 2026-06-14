# Changelog

Notable changes by version. Newest at the top. Bumps follow `docs/VERSIONING.md`.

## 0.8.0 - 2026-06-14

- Added a U bracket generator based on the angle bracket constraint model, with
  a base flange, mirrored upright flanges, constrained holes, countersinking,
  mirrored gussets, preview, and STL/3MF export.
- Added U bracket wizard selection, preserved U-specific settings, summary
  text, gusset controls, and user-facing tests.
- Added U bracket domain tests for mirrored hole placement, clamping, gussets,
  countersink fallback, and positive-volume geometry.

## 0.7.0 - 2026-05-17

- Added a GitHub Actions deployment pipeline that verifies and publishes the app
  to GitHub Pages on every push to `master`.
- Updated the GitHub Pages build base path for the `jdcb4/BracketFactory`
  repository.
- Changed the default production build to use relative asset paths for local
  filesystem previews.

## 0.6.3 - 2026-05-17

- Expanded angle bracket hole rows beyond two rows on wide brackets, with row limits derived from hardware pitch and bracket width.
- Added gusset face coverage from 25% to 100% so ribs can be shallow or full-depth.
- Tightened gusset layout availability against all active hole row positions to avoid row/rib clashes.

## 0.6.2 - 2026-05-17

- Expanded angle bracket width configuration up to 300 mm and raised the default angle bracket width.
- Changed angle bracket defaults so gussets start off.
- Replaced simple gusset counts with constrained layouts including center, single 25% rib, and 25% / 75% pair options.
- Tightened the step ribbon layout so the six-step wizard fits without its own horizontal scroll.

## 0.6.1 - 2026-05-17

- Moved angle bracket gusset configuration into its own wizard step after hole placement.
- Reworked gusset choices into constrained layouts that account for the selected hole row pattern.
- Fixed the preview grid positioning so the bracket no longer intersects the baseplate mesh.

## 0.6.0 - 2026-05-17

- Added an angle bracket generator with base and upright flanges, constrained mounting holes, countersinking, and optional gusset ribs.
- Enabled switching between flat L and angle bracket types in the guided wizard while preserving each bracket's settings.
- Added angle bracket domain tests for constraint clamping, countersink fallback, hole maxima, and positive-volume geometry.

## 0.5.1 - 2026-05-17

- Added preview control guidance under the 3D viewer.
- Fixed hole-count crashes by capping derived hole maxima to the supported range and clamping invalid numeric input during normalization.

## 0.5.0 - 2026-05-16

- Added a page heading and descriptive introduction above the interactive workbench.
- Wrapped the wizard controls, parameter panel, summary, preview, and export controls in one overarching workbench surface.
- Reworked the right column into separate Current bracket, Preview, and Export panels that align to the parameter panel height.
- Made the Current bracket summary more information dense.
- Clarified countersinking by showing countersink depth only in the hole-finish option, not as a mounting hardware property.

## 0.4.1 - 2026-05-16

- Moved Back to the left edge and Next to the right edge of the linked ribbon.
- Removed the ribbon progress count text.

## 0.4.0 - 2026-05-16

- Reworked the wizard into a fixed workbench layout with the linked navigation ribbon across the top.
- Moved Back and Next into the top ribbon and added a panel-level "Go to next setting" action.
- Made the parameter panel height stable across steps, with the summary and preview stacked in the right column.
- Condensed the selected-parameter summary and changed hardware selection from exposed cards to a compact dropdown.

## 0.3.0 - 2026-05-16

- Replaced the 2D canvas projection with an interactive Three.js preview that supports rotate, pan, zoom, and reset view.
- Reworked the parameter categories into a linked ribbon flow with Back and Next controls.
- Expanded mounting hardware options to metric and screw sizes.
- Added countersunk holes with thickness, edge-clearance, and pitch constraints based on fastener head diameter.

## 0.2.0 - 2026-05-16

- Initialized BracketFactory as a Vite React client app with TypeScript, Tailwind tokens, ESLint, Vitest, and GitHub Pages build support.
- Added the guided flat L bracket MVP with constrained dimensions, hardware selection, hole-count clamping, local JSCAD preview, and STL/3MF downloads.
- Added domain tests for flat L bracket constraints and geometry generation.
- Installed the requested `frontend-design` and `shadcn` agent skills under `.agents/skills`.
- Added the MVP wizard UX outline at `docs/ux-bracketfactory-mvp.html`.

## 0.1.0 - 2026-01-01

- Initial scaffold from the Project Initiation `client-only` preset.
