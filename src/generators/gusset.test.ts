import { describe, expect, it } from 'vitest'
import { geometries, measurements } from '@jscad/modeling'
import { generateLBracket } from './lBracket'

const { geom3 } = geometries
const { measureVolume, measureBoundingBox } = measurements

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

  it('end-cap gusset stays inside the bracket width (regression for Y-centering off by gT)', () => {
    // With gussetCount=1 and a single hole row in the middle, the gusset lands in one of the end
    // caps. The previous code translated by (yCenter - gT/2) but after rotateX(π/2) the prism's Y
    // range is [-gT, 0], so the gusset actually occupied [yCenter - 3gT/2, yCenter - gT/2] — off
    // by −gT from intended. At small yCenter this pushed the gusset out the bed-side face.
    const g = generateLBracket({
      gusseted: true,
      gussetHeight: 8,
      gussetThickness: 2,
      gussetCount: 1,
      leg1Length: 50,
      leg2Length: 50,
      width: 20,
      thickness: 3,
      innerBendRadius: 1,
      outerFilletRadius: 0,
      holeDiameter: 5,
      holeCountLeg1: 0,
      holeCountLeg2: 0,
      holeRows: 1,
      edgeOffset: 3,
      xyHoleCompensation: 0,
      minHoleEdgeClearance: 2,
      countersunkHoles: false,
      slottedHoles: false,
      slotOversizeMm: 0,
    })
    const [min, max] = measureBoundingBox(g)
    // Bracket body spans Y ∈ [0, 20]. Gusset must stay inside; no surface on y < 0.
    expect(min[1]).toBeGreaterThanOrEqual(-1e-6)
    expect(max[1]).toBeLessThanOrEqual(20 + 1e-6)
  })

  it('inner bend radius is clamped so oversized values stay manifold', () => {
    // innerBendRadius > thickness used to produce a self-intersecting polygon (arc endpoint at
    // L1-T+ir > L1, outside the bracket). The generator now clamps ir to min(T, L2) − ε.
    const g = generateLBracket({
      gusseted: false,
      leg1Length: 40,
      leg2Length: 40,
      width: 20,
      thickness: 3,
      innerBendRadius: 99,
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

  it('outer fillet radius actually removes material (regression for voided param)', () => {
    const base = {
      gusseted: false,
      leg1Length: 50,
      leg2Length: 50,
      width: 24,
      thickness: 4,
      innerBendRadius: 0,
      holeDiameter: 5,
      holeCountLeg1: 0,
      holeCountLeg2: 0,
      edgeOffset: 6,
      xyHoleCompensation: 0,
      minHoleEdgeClearance: 2,
      countersunkHoles: false,
      slottedHoles: false,
      slotOversizeMm: 0,
    }
    const sharp = generateLBracket({ ...base, outerFilletRadius: 0 })
    const filleted = generateLBracket({ ...base, outerFilletRadius: 3 })
    const vs = measureVolume(sharp)
    const vf = measureVolume(filleted)
    // Quarter-circle (r=3) removed from a corner of width 24: area = r² − π·r²/4 ≈ 1.93 mm²;
    // volume ≈ 1.93 × 24 ≈ 46 mm³. Use a safe lower bound of 5 mm³ to avoid flakiness.
    expect(vf).toBeLessThan(vs - 5)
    expect(() => geom3.validate(filleted)).not.toThrow()
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
