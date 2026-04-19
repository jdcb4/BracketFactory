import { booleans, extrusions, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { union, subtract } = booleans
const { extrudeLinear } = extrusions
const { polygon, cylinder } = primitives
const { translate, rotateX } = transforms

export interface ShelfBracketParams {
  wallLegHeight: number
  shelfLegLength: number
  width: number
  legThickness: number
  style: 'triangular' | 'l-shaped'
  lighteningCutout: boolean
  holeDiameter: number
  wallHoleCount: number
  shelfHoleCount: number
  edgeOffset: number
  wallHoleCountersunk: boolean
  screwAccessSlots: boolean
  screwAccessSlotDiameter: number
  slottedWallHoles: boolean
  slotOversizeMm: number
  xyHoleCompensation: number
  minHoleEdgeClearance: number
  countersinkIncludedAngleDeg?: number
}

/**
 * Shelf bracket: right-triangle frame in the X–Z plane, extruded along Y (width).
 *
 *   Wall leg:   x ∈ [0, Lt],  z ∈ [0, Hw]           (vertical, against wall at x = 0)
 *   Shelf leg:  x ∈ [0, Ls],  z ∈ [Hw − Lt, Hw]     (horizontal, shelf sits on z = Hw)
 *   Brace:      hypotenuse from (0, 0) ↔ (Ls, Hw − Lt) (compression diagonal)
 *
 * Triangular style fills the full right triangle (right angle at top-inside); with the lightening
 * cutout on, an inner triangle is subtracted leaving only the three structural bars (wall, shelf,
 * brace) — the canonical printable shelf bracket shape.
 *
 * Print on its side (one triangular face on the bed) so layer lines run along the load path.
 */
export function generateShelfBracket(p: ShelfBracketParams): Geom3 {
  const Lt = Math.max(2, p.legThickness)
  const Hw = Math.max(Lt * 3, p.wallLegHeight)
  const Ls = Math.max(Lt * 3, p.shelfLegLength)
  const W = Math.max(Lt, p.width)
  const holeR = Math.max(0.15, p.holeDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const csDeg = p.countersinkIncludedAngleDeg ?? 90

  const triangular = p.style === 'triangular'

  // Outer 2D profile in (x, z) — everything planar, then extrude along Y.
  const wallPoly = polygon({
    points: [
      [0, 0],
      [Lt, 0],
      [Lt, Hw],
      [0, Hw],
    ],
  })
  const shelfPoly = polygon({
    points: [
      [0, Hw - Lt],
      [Ls, Hw - Lt],
      [Ls, Hw],
      [0, Hw],
    ],
  })

  let profile2d = union(wallPoly, shelfPoly)

  if (triangular) {
    // Full outer right triangle: (0,0) — wall foot, (Ls, Hw) — shelf tip, (0, Hw) — wall-shelf inner corner.
    const outerTri = polygon({
      points: [
        [0, 0],
        [Ls, Hw],
        [0, Hw],
      ],
    })
    profile2d = union(profile2d, outerTri)

    if (p.lighteningCutout) {
      // Inner triangle offset inward by Lt from each of the three edges (wall x=0, shelf z=Hw, hypotenuse).
      // Parallel hypotenuse at normal distance Lt: -Hw·x + Ls·z = Lt·D, with D = √(Ls² + Hw²).
      const D = Math.sqrt(Ls * Ls + Hw * Hw)
      // Intersection with x = Lt: z = Lt·(D + Hw)/Ls
      const innerAz = (Lt * (D + Hw)) / Ls
      // Intersection with z = Hw - Lt: x = Ls - Lt·(Ls + D)/Hw
      const innerBx = Ls - (Lt * (Ls + D)) / Hw
      // Inner corner at top: Lt in from each right-angle edge.
      const innerC: [number, number] = [Lt, Hw - Lt]
      const innerA: [number, number] = [Lt, innerAz]
      const innerB: [number, number] = [innerBx, Hw - Lt]
      // Only subtract if the inner triangle is well-formed and leaves each bar at least Lt thick.
      const valid =
        innerAz < Hw - Lt - 0.5 &&
        innerBx > Lt + 0.5 &&
        innerBx - Lt > Lt + 1 &&
        Hw - Lt - innerAz > Lt + 1
      if (valid) {
        const inner = polygon({ points: [innerA, innerB, innerC] })
        profile2d = subtract(profile2d, inner)
      }
    }
  }

  // Extrude profile along Z, then rotate so extrusion runs along +Y (= bracket width).
  let solid: Geom3 = extrudeLinear({ height: W }, profile2d)
  solid = rotateX(Math.PI / 2, solid)
  solid = translate([0, W, 0], solid)

  // Wall holes: through the wall leg along X. Placed in the portion below the shelf leg (z ∈ [0, Hw − Lt])
  // so they never collide with the shelf leg.
  const wallN = Math.max(1, Math.round(p.wallHoleCount))
  const wallHoleSpan = Math.max(2 * (holeR + minE) + 1, Hw - Lt)
  const wallZs = holeCenters1dGrid(wallN, wallHoleSpan, p.edgeOffset, 0, holeR, minE)
  const wallSlot = p.slottedWallHoles ? Math.max(0, p.slotOversizeMm) : 0
  for (const z of wallZs) {
    solid = subtractThroughHole(
      solid,
      [Lt / 2, W / 2, z],
      holeR,
      Lt,
      'x',
      {
        countersunk: p.wallHoleCountersunk,
        countersinkWhich: 'neg',
        countersinkIncludedAngleDeg: csDeg,
        slotLengthExtra: wallSlot,
        slotAxis: 'z',
      },
    )
  }

  const shelfN = Math.max(0, Math.round(p.shelfHoleCount))
  if (shelfN > 0) {
    // Shelf holes go down through the shelf leg (from top at z = Hw). Placed beyond the wall leg so they
    // never punch the wall-leg thickness.
    const shelfHoleSpan = Math.max(2 * (holeR + minE) + 1, Ls - Lt)
    const shelfXs = holeCenters1dGrid(shelfN, shelfHoleSpan, p.edgeOffset, 0, holeR, minE).map(
      (x) => Lt + x,
    )
    for (const x of shelfXs) {
      solid = subtractThroughHole(
        solid,
        [x, W / 2, Hw - Lt / 2],
        holeR,
        Lt,
        'z',
        {
          countersunk: false,
          countersinkWhich: 'both',
          countersinkIncludedAngleDeg: csDeg,
        },
      )
    }

    // Screw-access slot through the brace web above each shelf hole, aligned with the hole's X.
    // Only useful when triangular with lightening off (otherwise the brace web is already open).
    if (triangular && !p.lighteningCutout && p.screwAccessSlots && p.screwAccessSlotDiameter > 2) {
      const slotR = Math.max(1.5, Math.min(p.screwAccessSlotDiameter / 2, (Hw - 2 * Lt) / 3))
      for (const x of shelfXs) {
        // Position the access hole a short distance below the shelf leg, on the hypotenuse side of x.
        const zBrace = Math.max(Lt + slotR + 0.5, Hw - Lt - slotR - 0.5)
        const access = translate(
          [x, W / 2, zBrace],
          rotateX(Math.PI / 2, cylinder({ radius: slotR, height: W + 4, segments: 24 })),
        )
        solid = subtract(solid, access)
      }
    }
  }

  return solid
}
