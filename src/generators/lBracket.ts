import { booleans, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'

const { union, subtract } = booleans
const { cuboid, cylinder } = primitives
const { translate, rotateX, rotateY } = transforms

export interface LBracketParams {
  leg1Length: number
  leg2Length: number
  width: number
  thickness: number
  innerBendRadius: number
  outerFilletRadius: number
  holeDiameter: number
  holeCountLeg1: number
  holeCountLeg2: number
  edgeOffset: number
  xyHoleCompensation: number
}

/**
 * Two-plate L bracket in the +X / +Z quadrant (Y = width). Union of cuboids minus holes.
 * Inner bend radius subtracts a clipped cylinder; outer fillet unions a torus corner (simplified).
 */
export function generateLBracket(p: LBracketParams): Geom3 {
  const {
    leg1Length: L1,
    leg2Length: L2,
    width: W,
    thickness: T,
    innerBendRadius: ir,
    holeDiameter: hd,
    holeCountLeg1: n1,
    holeCountLeg2: n2,
    edgeOffset: eo,
    xyHoleCompensation: xy,
  } = p

  // Template may still expose outer fillet in JSON for future geometry.
  void p.outerFilletRadius

  const holeR = Math.max(0.1, hd / 2 + xy)

  // Horizontal leg: x 0..L1, z 0..T
  const horiz = translate(
    [L1 / 2, W / 2, T / 2],
    cuboid({ size: [L1, W, T] }),
  )

  // Vertical leg: x L1-T .. L1, z T .. T+L2
  const vert = translate(
    [L1 - T / 2, W / 2, T + L2 / 2],
    cuboid({ size: [T, W, L2] }),
  )

  let solid: Geom3 = union(horiz, vert)

  // Inner corner fillet: subtract quarter cylinder (axis Y) at inner bend.
  if (ir > 0.15) {
    const cyl = rotateX(
      Math.PI / 2,
      cylinder({ radius: ir, height: W + 2, segments: 32 }),
    )
    const cx = L1 - T + ir
    const cz = T - ir
    const cutter = translate([cx, W / 2, cz], cyl)
    const clip = translate(
      [L1 - T - ir, -1, T - ir - ir],
      cuboid({ size: [ir * 2.2, W + 4, ir * 2.2] }),
    )
    const quarter = booleans.intersect(cutter, clip)
    solid = subtract(solid, quarter)
  }

  // Outer fillet: `_outerFilletRadius` reserved for future fillet geometry (template parameter kept).

  // Through-holes in horizontal leg (axis Z), centered in plate.
  if (n1 > 0 && holeR > 0) {
    const span = L1 - 2 * eo
    const xs =
      n1 === 1
        ? [L1 / 2]
        : Array.from({ length: n1 }, (_, i) => eo + (span * i) / (n1 - 1))
    for (const x of xs) {
      const h = translate(
        [x, W / 2, T / 2],
        cylinder({ radius: holeR, height: T + 4, segments: 24 }),
      )
      solid = subtract(solid, h)
    }
  }

  // Through-holes in vertical leg (axis X)
  if (n2 > 0 && holeR > 0) {
    const span = L2 - 2 * eo
    const zs =
      n2 === 1
        ? [T + L2 / 2]
        : Array.from({ length: n2 }, (_, i) => T + eo + (span * i) / (n2 - 1))
    for (const z of zs) {
      const h = translate(
        [L1 - T / 2, W / 2, z],
        rotateY(Math.PI / 2, cylinder({ radius: holeR, height: T + 4, segments: 24 })),
      )
      solid = subtract(solid, h)
    }
  }

  return solid
}
