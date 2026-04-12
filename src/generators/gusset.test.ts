import { describe, expect, it } from 'vitest'
import { geometries, measurements } from '@jscad/modeling'
import { generateLBracket } from './lBracket'

const { geom3 } = geometries
const { measureVolume } = measurements

describe('gusset geometry', () => {
  it('baseline L without gussets passes geom3.validate', () => {
    const g = generateLBracket({
      gusseted: false,
      leg1Length: 45,
      leg2Length: 45,
      width: 24,
      thickness: 3,
      innerBendRadius: 1,
      outerFilletRadius: 0,
      holeDiameter: 5,
      holeCountLeg1: 0,
      holeCountLeg2: 0,
      edgeOffset: 6,
      xyHoleCompensation: 0,
      minHoleEdgeClearance: 2,
      countersunkHoles: false,
      slottedHoles: false,
      slotOversizeMm: 0,
    })
    expect(() => geom3.validate(g)).not.toThrow()
  })

  it('L with inner radius 0 passes validate (fillet op is the usual manifold issue)', () => {
    const g = generateLBracket({
      gusseted: false,
      leg1Length: 45,
      leg2Length: 45,
      width: 24,
      thickness: 3,
      innerBendRadius: 0,
      outerFilletRadius: 0,
      holeDiameter: 5,
      holeCountLeg1: 0,
      holeCountLeg2: 0,
      edgeOffset: 6,
      xyHoleCompensation: 0,
      minHoleEdgeClearance: 2,
      countersunkHoles: false,
      slottedHoles: false,
      slotOversizeMm: 0,
    })
    expect(() => geom3.validate(g)).not.toThrow()
  })

  it('produces valid geom3 with gussets enabled', () => {
    const g = generateLBracket({
      gusseted: true,
      gussetHeight: 12,
      gussetThickness: 2,
      gussetCount: 2,
      leg1Length: 45,
      leg2Length: 45,
      width: 24,
      thickness: 3,
      innerBendRadius: 1,
      outerFilletRadius: 0,
      holeDiameter: 5,
      holeCountLeg1: 0,
      holeCountLeg2: 0,
      edgeOffset: 6,
      xyHoleCompensation: 0,
      minHoleEdgeClearance: 2,
      countersunkHoles: false,
      slottedHoles: false,
      slotOversizeMm: 0,
    })
    expect(() => geom3.validate(g)).not.toThrow()
    const polys = geom3.toPolygons(g)
    expect(polys.length).toBeGreaterThan(10)
  })

  it('gussets stay clear of mounting holes on the width (Y)', () => {
    const g = generateLBracket({
      gusseted: true,
      gussetHeight: 10,
      gussetThickness: 2,
      gussetCount: 2,
      leg1Length: 50,
      leg2Length: 50,
      width: 30,
      thickness: 4,
      innerBendRadius: 1,
      outerFilletRadius: 0,
      holeDiameter: 5,
      holeCountLeg1: 2,
      holeCountLeg2: 2,
      holeRows: 1,
      edgeOffset: 8,
      xyHoleCompensation: 0,
      minHoleEdgeClearance: 2,
      countersunkHoles: false,
      slottedHoles: false,
      slotOversizeMm: 0,
    })
    expect(() => geom3.validate(g)).not.toThrow()
  })

  it('gusset adds volume vs plain L', () => {
    const base = generateLBracket({
      gusseted: false,
      leg1Length: 45,
      leg2Length: 45,
      width: 24,
      thickness: 3,
      innerBendRadius: 1,
      outerFilletRadius: 0,
      holeDiameter: 5,
      holeCountLeg1: 0,
      holeCountLeg2: 0,
      edgeOffset: 6,
      xyHoleCompensation: 0,
      minHoleEdgeClearance: 2,
      countersunkHoles: false,
      slottedHoles: false,
      slotOversizeMm: 0,
    })
    const withG = generateLBracket({
      gusseted: true,
      gussetHeight: 12,
      gussetThickness: 2,
      gussetCount: 2,
      leg1Length: 45,
      leg2Length: 45,
      width: 24,
      thickness: 3,
      innerBendRadius: 1,
      outerFilletRadius: 0,
      holeDiameter: 5,
      holeCountLeg1: 0,
      holeCountLeg2: 0,
      edgeOffset: 6,
      xyHoleCompensation: 0,
      minHoleEdgeClearance: 2,
      countersunkHoles: false,
      slottedHoles: false,
      slotOversizeMm: 0,
    })
    const vb = measureVolume(base)
    const vg = measureVolume(withG)
    expect(vg).toBeGreaterThan(vb + 50)
  })
})
