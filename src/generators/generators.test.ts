import { describe, expect, it } from 'vitest'
import { geometries } from '@jscad/modeling'
import { generateFromStrategy } from './registry'

describe('generators', () => {
  it('builds non-empty geom3 for each MVP strategy', () => {
    const strategies = [
      'lBracket',
      'cornerBracket',
      'flatPlate',
      'uChannel',
      'extrusionBracket',
    ] as const
    for (const s of strategies) {
      const g = generateFromStrategy(s, {})
      const polys = geometries.geom3.toPolygons(g)
      expect(polys.length).toBeGreaterThan(0)
    }

    const gus = generateFromStrategy('lBracket', { gusseted: true, mountingBolt: 'custom' })
    expect(geometries.geom3.toPolygons(gus).length).toBeGreaterThan(0)
  })
})
