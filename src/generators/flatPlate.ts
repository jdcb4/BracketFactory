import { primitives } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { maxHoleRowsAlongWidth } from '../geometry/holeLayout'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { cuboid } = primitives

export interface FlatPlateParams {
  length: number
  width: number
  thickness: number
  /** Holes counted along the plate length (X). */
  holesAlongLength: number
  /** Holes counted along the plate width (Y). */
  holesAlongWidth: number
  holeDiameter: number
  holeSpacingX: number
  holeSpacingY: number
  edgeOffsetX: number
  edgeOffsetY: number
  xyHoleCompensation: number
  minHoleEdgeClearance: number
  countersunkHoles: boolean
  slottedHoles: boolean
  /** Extra slot length (mm) added along X for each hole (adjustment slots). */
  slotOversizeMm: number
  countersinkIncludedAngleDeg?: number
}

/** Flat mending plate with a rectangular grid of holes (through Z). Bottom sits on z = 0 for printing. */
export function generateFlatPlate(p: FlatPlateParams): Geom3 {
  const L = p.length
  const W = p.width
  const T = p.thickness
  let solid: Geom3 = cuboid({ size: [L, W, T] })

  const holeR = Math.max(0.15, p.holeDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const maxAlongL = maxHoleRowsAlongWidth(L, p.holeDiameter, p.edgeOffsetX, minE)
  const maxAlongW = maxHoleRowsAlongWidth(W, p.holeDiameter, p.edgeOffsetY, minE)
  const nx = Math.max(1, Math.min(Math.round(p.holesAlongLength), maxAlongL))
  const ny = Math.max(1, Math.min(Math.round(p.holesAlongWidth), maxAlongW))

  const xs = holeCenters1dGrid(nx, L, p.edgeOffsetX, p.holeSpacingX, holeR, p.minHoleEdgeClearance)
  const ys = holeCenters1dGrid(ny, W, p.edgeOffsetY, p.holeSpacingY, holeR, p.minHoleEdgeClearance)

  const slotExtra = p.slottedHoles ? Math.max(0, p.slotOversizeMm) : 0
  const csDeg = p.countersinkIncludedAngleDeg ?? 90

  for (const x of xs) {
    for (const y of ys) {
      solid = subtractThroughHole(
        solid,
        [x, y, T / 2],
        holeR,
        T,
        'z',
        {
          countersunk: p.countersunkHoles,
          countersinkWhich: 'both',
          countersinkIncludedAngleDeg: csDeg,
          slotLengthExtra: slotExtra,
          slotAxis: 'x',
        },
      )
    }
  }

  return solid
}
