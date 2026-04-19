import { booleans, extrusions, modifiers, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import {
  gussetCenterYsBetweenHoleRows,
  holeRowCentersAlongWidth,
  maxHoleRowsAlongWidth,
} from '../geometry/holeLayout'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { union } = booleans
// CJS/ESM typings expose `modifiers` in a way TS thinks is not callable; runtime is correct.
const generalizeGeom3 = modifiers.generalize as unknown as (
  opts: { snap?: boolean; triangulate?: boolean; simplify?: boolean },
  g: Geom3,
) => Geom3
const { extrudeLinear } = extrusions
const { polygon } = primitives
const { translate, rotateX, mirrorZ } = transforms

export interface LBracketParams {
  gusseted?: boolean
  gussetHeight?: number
  gussetThickness?: number
  gussetCount?: number
  leg1Length: number
  leg2Length: number
  width: number
  thickness: number
  innerBendRadius: number
  outerFilletRadius: number
  holeDiameter: number
  holeCountLeg1: number
  holeCountLeg2: number
  /** Parallel rows of holes across bracket width (Y). Clamped to what fits for hole diameter + clearance. */
  holeRows?: number
  edgeOffset: number
  xyHoleCompensation: number
  minHoleEdgeClearance: number
  countersunkHoles: boolean
  slottedHoles: boolean
  slotOversizeMm: number
  countersinkIncludedAngleDeg?: number
}

/** Quarter-circle arc (XZ profile): inner bend center at (L1−T+ir, T+ir), from inner vertical face to inner horizontal face. */
function innerBendArcPoints(L1: number, T: number, ir: number, segments: number): [number, number][] {
  const cx = L1 - T + ir
  const cz = T + ir
  const out: [number, number][] = []
  for (let i = 1; i < segments; i++) {
    const t = i / segments
    const angle = Math.PI + t * (Math.PI / 2)
    out.push([cx + ir * Math.cos(angle), cz + ir * Math.sin(angle)])
  }
  return out
}

/** Quarter-circle arc (XZ profile): outer corner fillet centered at (L1−ofr, ofr). Sweeps from the bottom face tangent (angle −π/2) to the outer vertical face tangent (angle 0). Interior points only; start/end emitted by caller. */
function outerFilletArcPoints(L1: number, ofr: number, segments: number): [number, number][] {
  const cx = L1 - ofr
  const cz = ofr
  const out: [number, number][] = []
  for (let i = 1; i < segments; i++) {
    const t = i / segments
    const angle = -Math.PI / 2 + t * (Math.PI / 2)
    out.push([cx + ofr * Math.cos(angle), cz + ofr * Math.sin(angle)])
  }
  return out
}

/**
 * L-shaped solid: one extruded CCW polygon in (x, z), then oriented to bracket (X, Y, Z).
 * Inner bend fillet and outer corner fillet are part of the profile (no cylinder boolean)
 * so geom3.validate stays manifold.
 */
function lShapeSolid(L1: number, L2: number, W: number, T: number, ir: number, ofr: number): Geom3 {
  const points: [number, number][] = []
  points.push([0, 0])
  if (ofr > 0.15) {
    // Outer corner fillet: sweep from bottom face → outer vertical face via quarter-circle.
    points.push([L1 - ofr, 0])
    points.push(...outerFilletArcPoints(L1, ofr, 24))
    points.push([L1, ofr])
  } else {
    points.push([L1, 0])
  }
  points.push([L1, T + L2], [L1 - T, T + L2])
  if (ir > 0.15) {
    points.push([L1 - T, T + ir])
    points.push(...innerBendArcPoints(L1, T, ir, 24))
    points.push([L1 - T + ir, T])
  } else {
    points.push([L1 - T, T])
  }
  points.push([0, T])

  let g = extrudeLinear({ height: W }, polygon({ points }))
  g = rotateX(-Math.PI / 2, g)
  g = mirrorZ(g)
  return g
}

/**
 * Triangular gusset: extruded triangle, rotated so thickness runs along +Y; right angle at inner bend.
 * `yCenter` is the mid-plane across the gusset thickness (changing thickness grows equally ±Y).
 *
 * After rotateX(π/2), the extruded prism's Y range is `[-gT, 0]` (extrusion axis was +Z, and
 * rotateX(π/2) maps (x,y,z) → (x,-z,y)). So translating by `yCenter + gT/2` centres the prism on
 * `yCenter`. Using `yCenter - gT/2` (the previous code) shifted the gusset by `-gT` from intended.
 */
function gussetPrism(L1: number, T: number, gH: number, gT: number, yCenter: number): Geom3 {
  // CCW when viewed from outside the solid after rotateX/translate (was inverted vs L-bracket union).
  const tri = polygon({ points: [[0, 0], [0, gH], [-gH, 0]] })
  let g = extrudeLinear({ height: gT }, tri)
  g = rotateX(Math.PI / 2, g)
  g = translate([L1 - T, yCenter + gT / 2, T], g)
  return g
}

/**
 * L bracket: single solid L + optional inner fillet + optional outer fillet + optional gussets + holes.
 */
export function generateLBracket(p: LBracketParams): Geom3 {
  const L1 = p.leg1Length
  const L2 = p.leg2Length
  const W = p.width
  const T = p.thickness
  // Inner bend radius: arc endpoints land at (L1-T+ir, T) and (L1-T, T+ir) on the inside corner,
  // so ir must fit both legs' available bend-adjacent material. Cap at min(T, L2) with a small
  // safety margin so the polygon can't self-intersect if the user cranks the slider.
  const ir = Math.max(0, Math.min(p.innerBendRadius, T - 0.1, L2 - 0.1))
  // Outer corner fillet: arc endpoints at (L1-ofr, 0) and (L1, ofr), so ofr must not exceed L1 or
  // the leg-2 column height T+L2. In practice a chunky outer fillet ruins the silhouette, so cap
  // at min(L1/2, T+L2-0.1) — a leg-2 that's all fillet is never what users want.
  const ofr = Math.max(0, Math.min(p.outerFilletRadius, L1 / 2 - 0.1, T + L2 - 0.1))
  const holeR = Math.max(0.15, p.holeDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const slotEx = p.slottedHoles ? Math.max(0, p.slotOversizeMm) : 0

  let solid: Geom3 = lShapeSolid(L1, L2, W, T, ir, ofr)

  const maxRows = maxHoleRowsAlongWidth(W, p.holeDiameter, p.edgeOffset, minE)
  const holeRows = Math.max(1, Math.min(Math.round(p.holeRows ?? 1), maxRows))
  const rowYs = holeRowCentersAlongWidth(holeRows, W, p.edgeOffset, holeR, minE)

  let gHActive = 0
  if (p.gusseted && (p.gussetHeight ?? 0) > 0.2 && (p.gussetThickness ?? 0) > 0.2) {
    const gH = p.gussetHeight ?? 12
    gHActive = gH
    const gT = p.gussetThickness ?? 2
    const gN = Math.max(1, Math.min(4, Math.round(p.gussetCount ?? 2)))
    const gussetYs = gussetCenterYsBetweenHoleRows(W, gN, gT, rowYs, holeR, minE)
    for (const yc of gussetYs) {
      solid = union(solid, gussetPrism(L1, T, gH, gT, yc))
    }
  }

  const n1 = Math.max(0, Math.round(p.holeCountLeg1))
  const n2 = Math.max(0, Math.round(p.holeCountLeg2))
  const csDeg = p.countersinkIncludedAngleDeg ?? 90

  // Along X / Z only: keep through-holes from cutting the inner gusset wedge (does not change hole-row Y positions).
  const edgeMargin = Math.max(p.edgeOffset, holeR + minE)
  let leg1HoleExtent = L1
  if (gHActive > 0) {
    const maxHoleCenterX = L1 - T - gHActive - holeR - minE
    leg1HoleExtent = Math.min(L1, maxHoleCenterX + edgeMargin)
  }

  if (n1 > 0 && holeR > 0) {
    const xs = holeCenters1dGrid(n1, leg1HoleExtent, p.edgeOffset, 0, holeR, minE)
    for (const y of rowYs) {
      for (const x of xs) {
        solid = subtractThroughHole(solid, [x, y, T / 2], holeR, T, 'z', {
          countersunk: p.countersunkHoles,
          // Single countersink on the outside face (+Z) so screw heads are not duplicated on the bed side.
          countersinkWhich: 'pos',
          countersinkIncludedAngleDeg: csDeg,
          slotLengthExtra: slotEx,
          slotAxis: 'x',
        })
      }
    }
  }

  if (n2 > 0 && holeR > 0) {
    const minZr = gHActive > 0 ? gHActive + holeR + minE : 0
    const leg2Span = Math.max(0.1, L2 - minZr)
    const zsRel = holeCenters1dGrid(n2, leg2Span, p.edgeOffset, 0, holeR, minE).map((zr) => zr + minZr)
    for (const y of rowYs) {
      for (const zr of zsRel) {
        const z = T + zr
        solid = subtractThroughHole(solid, [L1 - T / 2, y, z], holeR, T, 'x', {
          countersunk: p.countersunkHoles,
          countersinkWhich: 'pos',
          countersinkIncludedAngleDeg: csDeg,
          slotLengthExtra: slotEx,
          slotAxis: 'z',
        })
      }
    }
  }

  // Snap + triangulate fixes coplanar boolean seams (inner bend + gusset union) for geom3.validate.
  return generalizeGeom3({ snap: true, triangulate: true }, solid)
}
