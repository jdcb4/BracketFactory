import { booleans, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { getExtrusionProfile } from '../data/extrusions'
import { holeRowCentersAlongWidth, maxHoleRowsAlongWidth } from '../geometry/holeLayout'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { union, subtract } = booleans
const { cuboid } = primitives
const { translate } = transforms

export interface ExtrusionBracketParams {
  profile: '2020' | '3030' | '4040'
  armLength: number
  thickness: number
  ridgeClearance: number
  holeDiameter: number
  holeCount: number
  /** Parallel rows of holes across the bracket width (Y). */
  holeRows?: number
  edgeOffset: number
  xyHoleCompensation: number
  minHoleEdgeClearance: number
  countersunkHoles: boolean
  slottedHoles: boolean
  slotOversizeMm: number
  countersinkIncludedAngleDeg?: number
}

/**
 * Extrusion L-bracket: vertical plate against the extrusion, foot on the bed (z = 0). Slot pocket on the vertical face.
 */
export function generateExtrusionBracket(p: ExtrusionBracketParams): Geom3 {
  const prof = getExtrusionProfile(p.profile)
  const slot = prof.slotWidthMm + p.ridgeClearance
  const L = p.armLength
  const T = p.thickness
  const W = prof.gridMm

  const body = translate([T / 2, W / 2, L / 2], cuboid({ size: [T, W, L] }))
  const foot = translate([W / 2 + T, W / 2, T / 2], cuboid({ size: [W + T * 2, W, T] }))
  let solid: Geom3 = union(body, foot)

  const pocket = translate([T / 2, W / 2, L / 2], cuboid({ size: [T + 2, slot, prof.slotDepthMm * 2] }))
  solid = subtract(solid, pocket)

  const holeR = Math.max(0.15, p.holeDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const n = Math.max(1, Math.round(p.holeCount))
  const zs = holeCenters1dGrid(n, L, p.edgeOffset, 0, holeR, minE)
  const maxRows = maxHoleRowsAlongWidth(W, p.holeDiameter, p.edgeOffset, minE)
  const holeRows = Math.max(1, Math.min(Math.round(p.holeRows ?? 1), maxRows))
  const rowYs = holeRowCentersAlongWidth(holeRows, W, p.edgeOffset, holeR, minE)
  const slotEx = p.slottedHoles ? Math.max(0, p.slotOversizeMm) : 0
  const csDeg = p.countersinkIncludedAngleDeg ?? 90

  for (const z of zs) {
    for (const y of rowYs) {
      solid = subtractThroughHole(solid, [T / 2, y, z], holeR, T, 'x', {
        countersunk: p.countersunkHoles,
        countersinkWhich: 'pos',
        countersinkIncludedAngleDeg: csDeg,
        slotLengthExtra: slotEx,
        slotAxis: 'z',
      })
    }
  }

  return solid
}
