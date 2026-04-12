import { describe, expect, it } from 'vitest'
import { geometries } from '@jscad/modeling'
import { generateFromStrategy } from './registry'

describe('generators', () => {
  it('builds non-empty geom3 for each MVP strategy', () => {
    const strategies = [
      'lBracket',
      'gussetedCorner',
      'flatPlate',
      'uChannel',
      'extrusionBracket',
    ] as const
    for (const s of strategies) {
      const g = generateFromStrategy(s, {})
      const polys = geometries.geom3.toPolygons(g)
      expect(polys.length).toBeGreaterThan(0)
    }
  })
})
