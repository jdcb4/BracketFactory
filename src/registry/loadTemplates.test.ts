import { describe, expect, it } from 'vitest'
import { getTemplateById, loadAllTemplates } from './loadTemplates'

describe('loadTemplates', () => {
  it('loads MVP templates from build-time glob (excludes JSON Schema file)', () => {
    const all = loadAllTemplates()
    expect(all.length).toBe(6)
    expect(all.some((t) => t.template.id === '_schema')).toBe(false)
  })

  it('finds l-bracket by id', () => {
    expect(getTemplateById('l-bracket')?.id).toBe('l-bracket')
  })
})
