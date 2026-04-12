import { booleans, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { union } = booleans
const { cuboid } = primitives
const { translate } = transforms

export interface UChannelParams {
  baseWidth: number
  leftFlangeHeight: number
  rightFlangeHeight: number
  thickness: number
  length: number
  holeDiameter: number
  holesPerFlange: number
  edgeOffset: number
  xyHoleCompensation: number
  minHoleEdgeClearance: number
  countersunkHoles: boolean
  slottedHoles: boolean
  slotOversizeMm: number
  countersinkIncludedAngleDeg?: number
}

/**
 * U-channel along X: base on z = 0 (print bed), flanges extend +Z. Holes through each flange (axis Y).
 */
export function generateUChannel(p: UChannelParams): Geom3 {
  const B = p.baseWidth
  const hL = p.leftFlangeHeight
  const hR = p.rightFlangeHeight
  const T = p.thickness
  const L = p.length
  const base = translate([L / 2, B / 2, T / 2], cuboid({ size: [L, B, T] }))
  const left = translate([L / 2, T / 2, T + hL / 2], cuboid({ size: [L, T, hL] }))
  const right = translate([L / 2, B - T / 2, T + hR / 2], cuboid({ size: [L, T, hR] }))
  let solid: Geom3 = union(base, left, right)

  const holeR = Math.max(0.15, p.holeDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const n = Math.max(1, Math.round(p.holesPerFlange))
  const xs = holeCenters1dGrid(n, L, p.edgeOffset, 0, holeR, minE)
  const slotEx = p.slottedHoles ? Math.max(0, p.slotOversizeMm) : 0
  const csDeg = p.countersinkIncludedAngleDeg ?? 90

  for (const x of xs) {
    solid = subtractThroughHole(solid, [x, T / 2, T + hL / 2], holeR, T, 'y', {
      countersunk: p.countersunkHoles,
      countersinkWhich: 'neg',
      countersinkIncludedAngleDeg: csDeg,
      slotLengthExtra: slotEx,
      slotAxis: 'z',
    })
    solid = subtractThroughHole(solid, [x, B - T / 2, T + hR / 2], holeR, T, 'y', {
      countersunk: p.countersunkHoles,
      countersinkWhich: 'pos',
      countersinkIncludedAngleDeg: csDeg,
      slotLengthExtra: slotEx,
      slotAxis: 'z',
    })
  }

  return solid
}
