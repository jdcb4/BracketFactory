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
      'shelfBracket',
      'frenchCleat',
      'pipeSaddleClamp',
    ] as const
    const base = { mountingBolt: 'M5' as const }
    for (const s of strategies) {
      const g = generateFromStrategy(s, base)
      const polys = geometries.geom3.toPolygons(g)
      expect(polys.length).toBeGreaterThan(0)
    }

    const gus = generateFromStrategy('lBracket', { gusseted: true, mountingBolt: 'custom' })
    expect(geometries.geom3.toPolygons(gus).length).toBeGreaterThan(0)
  })

  it('french cleat: holes are actually subtracted (regression for broken rotation)', () => {
    // If the rotation transform is wrong, holes land outside the body and the subtract is a no-op.
    // Polygon count must grow with holes vs. without.
    const base = {
      mountingBolt: 'M5' as const,
      cleatType: 'wall',
      length: 100,
      boardThickness: 18,
      totalHeight: 50,
      wedgeAngle: 45,
      edgeOffset: 12,
      countersunkHoles: false, // isolate the through-hole effect
      slottedHoles: false,
    }
    const noHoles = generateFromStrategy('frenchCleat', { ...base, holeCount: 0 })
    const withHoles = generateFromStrategy('frenchCleat', { ...base, holeCount: 3 })
    const noHolesCount = geometries.geom3.toPolygons(noHoles).length
    const withHolesCount = geometries.geom3.toPolygons(withHoles).length
    expect(withHolesCount).toBeGreaterThan(noHolesCount)
  })
})
