import { booleans, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'

const { union, subtract } = booleans
const { cuboid, cylinder } = primitives
const { translate, rotateY } = transforms

export interface GussetedCornerParams {
  leg1Length: number
  leg2Length: number
  width: number
  thickness: number
  gussetHeight: number
  gussetThickness: number
  gussetCount: number
  holeDiameter: number
  holeCountLeg1: number
  holeCountLeg2: number
  edgeOffset: number
  xyHoleCompensation: number
}

/** L-shape plus triangular gusset plates on the inside corner. */
export function generateGussetedCorner(p: GussetedCornerParams): Geom3 {
  const L1 = p.leg1Length
  const L2 = p.leg2Length
  const W = p.width
  const T = p.thickness
  const gH = p.gussetHeight
  const gT = p.gussetThickness
  const gN = Math.max(1, Math.min(4, Math.round(p.gussetCount)))

  const horiz = translate([L1 / 2, W / 2, T / 2], cuboid({ size: [L1, W, T] }))
  const vert = translate(
    [L1 - T / 2, W / 2, T + L2 / 2],
    cuboid({ size: [T, W, L2] }),
  )
  let solid: Geom3 = union(horiz, vert)

  // Place gussets evenly along Y.
  const spacing = W / (gN + 1)
  for (let i = 1; i <= gN; i++) {
    const y = spacing * i
    // Triangle in XZ at fixed y: approximate with thin box along hypotenuse from inner corner.
    const tri = translate(
      [L1 - T + gT / 2, y, T + gH / 2],
      cuboid({ size: [gT, gT, gH] }),
    )
    solid = union(solid, tri)
  }

  const holeR = Math.max(0.1, p.holeDiameter / 2 + p.xyHoleCompensation)
  if (p.holeCountLeg1 > 0 && holeR > 0) {
    const span = L1 - 2 * p.edgeOffset
    const xs =
      p.holeCountLeg1 === 1
        ? [L1 / 2]
        : Array.from(
            { length: p.holeCountLeg1 },
            (_, j) => p.edgeOffset + (span * j) / (p.holeCountLeg1 - 1),
          )
    for (const x of xs) {
      solid = subtract(
        solid,
        translate(
          [x, W / 2, T / 2],
          cylinder({ radius: holeR, height: T + 4, segments: 24 }),
        ),
      )
    }
  }
  if (p.holeCountLeg2 > 0 && holeR > 0) {
    const span = L2 - 2 * p.edgeOffset
    const zs =
      p.holeCountLeg2 === 1
        ? [T + L2 / 2]
        : Array.from(
            { length: p.holeCountLeg2 },
            (_, j) => T + p.edgeOffset + (span * j) / (p.holeCountLeg2 - 1),
          )
    for (const z of zs) {
      solid = subtract(
        solid,
        translate(
          [L1 - T / 2, W / 2, z],
          rotateY(Math.PI / 2, cylinder({ radius: holeR, height: T + 4, segments: 24 })),
        ),
      )
    }
  }

  return solid
}
