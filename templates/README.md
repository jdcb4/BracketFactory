# Template files

- Add new templates as `*.json` next to this README.
- Validate against `templates/_schema.json` (`npm test` runs Ajv on every file).
- Do not edit `_schema.json` unless you intend to change the contract for all templates.

Each template’s `generationStrategy` must exist in `src/generators/registry.ts`.
