import { extrusions, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { extrudeLinear } = extrusions
const { polygon } = primitives
const { translate, rotateX, rotateY, mirrorZ } = transforms

export interface FrenchCleatParams {
  cleatType: 'wall' | 'item'
  length: number
  boardThickness: number
  totalHeight: number
  wedgeAngle: number
  printTolerance: number
  holeDiameter: number
  holeCount: number
  edgeOffset: number
  countersunkHoles: boolean
  slottedHoles: boolean
  slotOversizeMm: number
  xyHoleCompensation: number
  minHoleEdgeClearance: number
  countersinkIncludedAngleDeg?: number
}

/**
 * French cleat: right-trapezoid profile in (y, z), extruded along X.
 *
 * Wall cleat profile (before any item-side mirroring):
 *   back face (y = 0):   full height z ∈ [0, H]         — against the wall, takes the screws
 *   bottom face (z = 0): full depth  y ∈ [0, B]         — sits on the bed while printing
 *   front face (y = B):  partial     z ∈ [0, hFront]    — shorter outer face
 *   bevel:               (B, hFront) → (0, H)           — 45°-ish up-and-back bevel
 *
 * where hFront = H − B · tan(φ), φ = wedge angle from vertical (45° standard).
 *
 * Item cleat: wall cleat mirrored about z = H/2 so the bevels mate when the item is lowered onto
 * the wall cleat. Wall-cleat mating clearance is added to B (slightly loose fit in the slot);
 * item-cleat clearance is subtracted from B (the male wedge is trimmed).
 */
export function generateFrenchCleat(p: FrenchCleatParams): Geom3 {
  const L = p.length
  const B0 = p.boardThickness
  const tol = Math.max(0, p.printTolerance)
  const isWall = p.cleatType === 'wall'
  // Wall cleat slightly widened, item cleat slightly trimmed — total gap = tol.
  const B = isWall ? B0 + tol / 2 : Math.max(2, B0 - tol / 2)
  const H = Math.max(B * 2, p.totalHeight) // must be tall enough to host both the wedge and the screw strip
  const angleClamped = Math.min(60, Math.max(30, p.wedgeAngle))
  const phi = (angleClamped * Math.PI) / 180
  // hFront: height of the short outer face. Floor at H * 0.35 so there's always a solid lip to grip.
  const hFrontRaw = H - B / Math.tan(phi)
  const hFront = Math.max(H * 0.35, Math.min(H - B * 0.5, hFrontRaw))

  // Wall profile points (y, z), counter-clockwise:
  const pts: [number, number][] = [
    [0, 0],
    [B, 0],
    [B, hFront],
    [0, H],
  ]

  // Polygon lives in jscad (X, Y) = bracket (y, z); extrudeLinear extrudes along +Z (= bracket x).
  // rotateY(π/2) sends extrusion axis to +X; rotateX(π/2) then swaps (z→y, y→z) without sign flips.
  let solid: Geom3 = extrudeLinear({ height: L }, polygon({ points: pts }))
  solid = rotateY(Math.PI / 2, solid)
  solid = rotateX(Math.PI / 2, solid)
  // Final mapping: bracket (x, y, z) = jscad (x, y, z), with x ∈ [0, L], y ∈ [0, B], z ∈ [0, H].

  // Holes: through the full-height back strip (y direction), placed at roughly 1/3 of H so they sit
  // within the rectangular section regardless of wedge angle.
  const holeR = Math.max(0.15, p.holeDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const xs = holeCenters1dGrid(Math.round(p.holeCount), L, p.edgeOffset, 0, holeR, minE)
  const zHole = Math.min(hFront - holeR - minE, Math.max(holeR + minE, H * 0.33))
  const slotExtra = p.slottedHoles ? Math.max(0, p.slotOversizeMm) : 0
  const csDeg = p.countersinkIncludedAngleDeg ?? 90

  for (const x of xs) {
    solid = subtractThroughHole(
      solid,
      [x, B / 2, zHole],
      holeR,
      B,
      'y',
      {
        countersunk: p.countersunkHoles,
        // Screw enters from the back face (against the wall / item).
        countersinkWhich: 'neg',
        countersinkIncludedAngleDeg: csDeg,
        slotLengthExtra: slotExtra,
        slotAxis: 'x',
      },
    )
  }

  // Item cleat = wall cleat mirrored about z = H/2. The bevel now points down-and-back, mating with
  // the wall cleat's up-and-back bevel when the item is lowered onto the wall.
  if (!isWall) {
    solid = translate([0, 0, H], mirrorZ(solid))
  }

  return solid
}
