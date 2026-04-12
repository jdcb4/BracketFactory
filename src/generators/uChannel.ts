import { booleans, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'

const { union, subtract } = booleans
const { cuboid, cylinder } = primitives
const { translate, rotateX } = transforms

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
}

/**
 * U-channel along X: base in XY, flanges extend +Z on left/right edges.
 */
export function generateUChannel(p: UChannelParams): Geom3 {
  const B = p.baseWidth
  const hL = p.leftFlangeHeight
  const hR = p.rightFlangeHeight
  const T = p.thickness
  const L = p.length
  const base = translate([L / 2, B / 2, T / 2], cuboid({ size: [L, B, T] }))
  const left = translate(
    [L / 2, T / 2, T + hL / 2],
    cuboid({ size: [L, T, hL] }),
  )
  const right = translate(
    [L / 2, B - T / 2, T + hR / 2],
    cuboid({ size: [L, T, hR] }),
  )
  let solid: Geom3 = union(base, left, right)

  const holeR = Math.max(0.1, p.holeDiameter / 2 + p.xyHoleCompensation)
  const n = Math.max(1, Math.round(p.holesPerFlange))
  const span = L - 2 * p.edgeOffset
  const xs =
    n === 1
      ? [L / 2]
      : Array.from({ length: n }, (_, i) => p.edgeOffset + (span * i) / (n - 1))

  for (const x of xs) {
    // Left flange holes (through Y)
    solid = subtract(
      solid,
      translate(
        [x, T / 2, T + hL / 2],
        rotateX(Math.PI / 2, cylinder({ radius: holeR, height: T + 4, segments: 24 })),
      ),
    )
    // Right flange
    solid = subtract(
      solid,
      translate(
        [x, B - T / 2, T + hR / 2],
        rotateX(Math.PI / 2, cylinder({ radius: holeR, height: T + 4, segments: 24 })),
      ),
    )
  }

  return solid
}
