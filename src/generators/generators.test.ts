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

  it('pipe saddle: buttresses and bridge support actually add material', () => {
    // Regression guard: the previous implementation silently no-op'd because (a) rotateY(-π/2)
    // misaligned the strap from the base in X, and (b) the bridge-support condition
    // span = lift - 1 never fired at the default lift=0.
    const base = {
      mountingBolt: 'M5' as const,
      pipeDiameter: 25,
      strapWidth: 18,
      strapThickness: 3,
      tabLength: 14,
      baseThickness: 4,
      wrapAngle: 180,
    }
    const plain = generateFromStrategy('pipeSaddleClamp', base)
    const buttressed = generateFromStrategy('pipeSaddleClamp', {
      ...base,
      buttressed: true,
      buttressHeight: 8,
      buttressThickness: 2,
    })
    const withBridge = generateFromStrategy('pipeSaddleClamp', {
      ...base,
      pipeLift: 6, // must exceed strapThickness=3 for the strut to be created
      bridgeSupport: true,
    })
    const plainN = geometries.geom3.toPolygons(plain).length
    expect(geometries.geom3.toPolygons(buttressed).length).toBeGreaterThan(plainN)
    expect(geometries.geom3.toPolygons(withBridge).length).toBeGreaterThan(
      geometries.geom3.toPolygons(generateFromStrategy('pipeSaddleClamp', { ...base, pipeLift: 6 })).length,
    )
  })
})
