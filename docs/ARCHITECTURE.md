# Architecture - BracketFactory

## Runtime shape

BracketFactory is a static Vite React app deployed to GitHub Pages. All bracket parameters, constraint checks, JSCAD geometry generation, Three.js preview rendering, and STL/3MF serialization run in the browser. There is no server, auth, database, or persistence layer in the MVP.

## Module boundaries

- `src/app` - app shell and framework entrypoints.
- `src/features/bracket-wizard` - feature-specific UI, JSCAD-to-Three preview conversion, and orchestration.
- `src/components/ui` - generic visual primitives backed by semantic tokens.
- `src/domain/brackets` - pure bracket rules, parameter normalization, JSCAD geometry generation, and export helpers.
- `src/lib` - small generic helpers without domain knowledge.
- `src/styles` - global styles and token definitions.
- `src/tests` - shared test setup.

## Boundary rules

- Domain constraint code does not import React or browser UI APIs.
- UI owns wizard state and calls domain functions for normalized parameters, geometry, summaries, and downloads.
- Preview code converts the generated JSCAD solid into a Three.js buffer geometry for local orbit, pan, and zoom controls. It does not create alternate bracket geometry.
- JSCAD geometry generation stays in domain modules so bracket types can be tested independently.
- Export helpers convert JSCAD geometry to browser `Blob` objects. They do not own parameter validation.
- Design tokens in `src/styles/tokens.css` remain the source of truth for visual style.

## Flat L bracket model

The first bracket type is a flat L plate formed from two rectangular legs sharing a corner square. Mounting holes are subtracted from the generated solid. Holes are constrained by:

- minimum edge clearance of `max(6 mm, 1.75 x hole diameter)`;
- minimum pitch of `max(12 mm, 2.8 x hole diameter)`;
- exclusion from the shared inside-corner square;
- row count capped by leg width and hardware clearance.

Countersunk holes use the fastener head diameter as the protected diameter for edge clearance and pitch. The option is disabled when plate thickness cannot leave at least 1.2 mm of material below the countersink.

## Angle bracket model

The angle bracket is a 90-degree bracket formed from a horizontal base flange and a vertical upright flange. Mounting holes are subtracted through each face. Optional triangular gusset ribs sit inside the corner and are constrained by bracket width and hole row count so ribs do not consume the same clear bands as mounting holes. The bracket width can be configured up to 300 mm.

Angle bracket holes are constrained by:

- minimum edge clearance of `max(7 mm, 0.9 x protected diameter, 1.8 x hole diameter)`;
- minimum pitch of `max(14 mm, protected diameter + 5 mm, 3 x hole diameter)`;
- exclusion from the corner thickness zone;
- row count capped by bracket width, hardware clearance, and safe pitch, up to six rows;
- gusset layouts filtered by all active row positions, available clear width, and protected hole bands.

Supported gusset layouts are no ribs, one center rib, one 25% width rib, and a balanced 25% / 75% pair. Gussets default to off.
Gusset rib depth is configurable from 25% to 100% of the face lengths.

Countersunk angle bracket holes use the fastener head diameter for clearance and pitch limits. The option is disabled when plate thickness cannot leave at least 1.2 mm of material below the countersink.

## Persistence

No persistence is implemented. If presets or saved designs are introduced later, start with JSON data validated with Zod. Move to a database only when JSON is insufficient and document the migration in `docs/DECISIONS.md`.

## Validation

Zod validates bracket parameter shape. Derived constraints normalize unsafe combinations before geometry is generated.

## Testing

- Vitest with `jsdom` for React tests.
- Domain tests cover constraint derivation, clamping, and positive-volume geometry generation.
- Component tests cover the wizard shell and export affordances.

## Deployment

See `docs/DEPLOYMENT.md`.
