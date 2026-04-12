import type { BracketTemplate } from '../types/template'

/** Flat map of parameter defaults from a template JSON definition. */
export function defaultParamsFromTemplate(
  template: BracketTemplate,
): Record<string, string | number | boolean> {
  const o: Record<string, string | number | boolean> = {}
  for (const p of template.parameters) {
    o[p.key] = p.default
  }
  return o
}
