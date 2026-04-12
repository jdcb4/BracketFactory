import { booleans, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'

const { subtract } = booleans
const { cuboid, cylinder } = primitives
const { translate } = transforms

export interface FlatPlateParams {
  length: number
  width: number
  thickness: number
  holeRows: number
  holeCols: number
  holeDiameter: number
  holeSpacingX: number
  holeSpacingY: number
  edgeOffsetX: number
  edgeOffsetY: number
  xyHoleCompensation: number
}

/** Flat mending plate with a rectangular grid of holes (through Z). */
export function generateFlatPlate(p: FlatPlateParams): Geom3 {
  const L = p.length
  const W = p.width
  const T = p.thickness
  // Origin at bottom corner; plate sits z=0..T
  let solid: Geom3 = cuboid({ size: [L, W, T] })

  const holeR = Math.max(0.1, p.holeDiameter / 2 + p.xyHoleCompensation)
  const rows = Math.max(1, Math.round(p.holeRows))
  const cols = Math.max(1, Math.round(p.holeCols))

  const sx =
    p.holeSpacingX > 0 ? p.holeSpacingX : rows > 1 ? (L - 2 * p.edgeOffsetX) / (rows - 1) : 0
  const sy =
    p.holeSpacingY > 0 ? p.holeSpacingY : cols > 1 ? (W - 2 * p.edgeOffsetY) / (cols - 1) : 0

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = p.edgeOffsetX + i * sx
      const y = p.edgeOffsetY + j * sy
      const h = translate(
        [x, y, T / 2],
        cylinder({ radius: holeR, height: T + 4, segments: 24 }),
      )
      solid = subtract(solid, h)
    }
  }

  return solid
}
