# Adding a template

1. Copy an existing JSON file under `templates/` (e.g. `l-bracket.json`).
2. Set a new `id` (kebab-case) and update metadata and `generationStrategy` if you add a new generator.
3. Implement geometry in `src/generators/<name>.ts` and register it in `src/generators/registry.ts`.
4. Run `npm test` (schema validation runs for every JSON file).
5. Run `npm run dev` and exercise the template in the UI; export an STL and sanity-check in a slicer.

See also `templates/README.md`.
