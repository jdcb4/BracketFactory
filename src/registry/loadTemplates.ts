import type { BracketTemplate } from '../types/template'

// Build-time glob: every JSON template except schema (filtered below).
// Repo-root `templates/` — build-time only (see docs/template-spec.md).
const rawModules = import.meta.glob<{ default: BracketTemplate }>('../../templates/*.json', {
  eager: true,
})

export interface LoadedTemplate {
  readonly path: string
  readonly template: BracketTemplate
}

/**
 * All templates from `/templates/*.json` (excluding `_schema.json` via id check).
 */
export function loadAllTemplates(): LoadedTemplate[] {
  const out: LoadedTemplate[] = []
  for (const path of Object.keys(rawModules)) {
    const mod = rawModules[path]
    const template = mod.default
    // `_schema.json` is JSON Schema, not a bracket template (no strategy / parameters).
    if (path.includes('_schema')) continue
    if (!template?.generationStrategy || !Array.isArray(template.parameters)) continue
    out.push({ path, template })
  }
  return out.sort((a, b) => a.template.name.localeCompare(b.template.name))
}

export function getTemplateById(id: string): BracketTemplate | undefined {
  return loadAllTemplates().find((t) => t.template.id === id)?.template
}
