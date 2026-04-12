import { describe, expect, it } from 'vitest'
import { getTemplateById, loadAllTemplates } from './loadTemplates'

describe('loadTemplates', () => {
  it('loads MVP templates from build-time glob', () => {
    const all = loadAllTemplates()
    expect(all.length).toBeGreaterThanOrEqual(5)
  })

  it('finds l-bracket by id', () => {
    expect(getTemplateById('l-bracket')?.id).toBe('l-bracket')
  })
})
