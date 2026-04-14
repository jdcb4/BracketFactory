import { booleans, extrusions, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { union, subtract } = booleans
const { extrudeLinear } = extrusions
const { polygon, cuboid } = primitives
const { translate, rotateY, mirrorZ } = transforms

export interface FrenchCleatParams {
  cleatType: 'wall' | 'item'
  length: number
  boardThickness: number
  totalHeight: number
  wedgeAngle: number
  printTolerance: number
  lockTab: boolean
  lockTabDepth: number
  endChamfer: number
  wedgeReinforcement: boolean
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
 * French cleat: trapezoid profile in the printer bed plane (depth × height), extruded along length X.
 * Back face is y = 0 (through-holes along +Y into the board).
 */
export function generateFrenchCleat(p: FrenchCleatParams): Geom3 {
  const L = p.length
  const B0 = p.boardThickness
  const tol = Math.max(0, p.printTolerance)
  const isWall = p.cleatType === 'wall'
  const B = isWall ? B0 + tol * 0.5 : Math.max(2, B0 - tol * 0.5)
  const H = p.totalHeight
  const φ = (p.wedgeAngle * Math.PI) / 180
  const hBack = Math.max(2, H - B / Math.tan(φ))

  const pts: [number, number][] = [
    [0, 0],
    [0, hBack],
    [B, H],
    [B, 0],
  ]

  // Profile in (y, z); extrude along default Z → then rotate so length is +X.
  let solid: Geom3 = extrudeLinear({ height: L }, polygon({ points: pts }))
  solid = rotateY(-Math.PI / 2, solid)

  const holeR = Math.max(0.15, p.holeDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const xs = holeCenters1dGrid(Math.round(p.holeCount), L, p.edgeOffset, 0, holeR, minE)
  // Holes in the vertical back strip (below the wedge break), slightly above the bottom edge.
  const zHole = Math.max(holeR + minE, Math.min(hBack * 0.45, H * 0.35))
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
        countersinkWhich: 'neg',
        countersinkIncludedAngleDeg: csDeg,
        slotLengthExtra: slotExtra,
        slotAxis: 'x',
      },
    )
  }

  // Item half: flip vertically so the wedge engages the wall half.
  if (!isWall) {
    solid = translate([0, 0, H], mirrorZ(solid))
  }

  if (p.lockTab && !isWall && p.lockTabDepth > 0.2) {
    const tab = translate(
      [L * 0.45, B * 0.35, Math.min(2, H * 0.05)],
      cuboid({ size: [L * 0.08, Math.min(p.lockTabDepth, B * 0.45), Math.min(3, H * 0.1)] }),
    )
    solid = union(solid, tab)
  }

  const ch = Math.max(0, p.endChamfer)
  if (ch > 0.2 && ch < L / 4) {
    const cutter = translate([-1, -1, -1], cuboid({ size: [ch + 1, B + 4, ch + 1] }))
    solid = subtract(solid, cutter)
    solid = subtract(solid, translate([L - ch, 0, 0], cutter))
  }

  void p.wedgeReinforcement

  return solid
}
