import { booleans, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { getExtrusionProfile } from '../data/extrusions'

const { union, subtract } = booleans
const { cuboid, cylinder } = primitives
const { translate, rotateY } = transforms

export interface ExtrusionBracketParams {
  profile: '2020' | '3030' | '4040'
  armLength: number
  thickness: number
  ridgeClearance: number
  holeDiameter: number
  holeCount: number
  edgeOffset: number
  xyHoleCompensation: number
}

/**
 * Simplified extrusion L-bracket: body + tab with slot clearance derived from profile.
 */
export function generateExtrusionBracket(p: ExtrusionBracketParams): Geom3 {
  const prof = getExtrusionProfile(p.profile)
  const slot = prof.slotWidthMm + p.ridgeClearance
  const L = p.armLength
  const T = p.thickness
  const W = prof.gridMm

  // Vertical plate against extrusion face
  const body = translate([T / 2, W / 2, L / 2], cuboid({ size: [T, W, L] }))
  // Horizontal foot
  const foot = translate(
    [W / 2 + T, W / 2, T / 2],
    cuboid({ size: [W + T * 2, W, T] }),
  )
  let solid: Geom3 = union(body, foot)

  // Slot pocket (subtract) on vertical face — box approximation.
  const pocket = translate(
    [T / 2, W / 2, L / 2],
    cuboid({ size: [T + 2, slot, prof.slotDepthMm * 2] }),
  )
  solid = subtract(solid, pocket)

  const holeR = Math.max(0.1, p.holeDiameter / 2 + p.xyHoleCompensation)
  const n = Math.max(1, Math.round(p.holeCount))
  const span = L - 2 * p.edgeOffset
  const zs =
    n === 1
      ? [L / 2]
      : Array.from({ length: n }, (_, i) => p.edgeOffset + (span * i) / (n - 1))

  for (const z of zs) {
    solid = subtract(
      solid,
      translate(
        [T / 2, W / 2, z],
        rotateY(Math.PI / 2, cylinder({ radius: holeR, height: T + 4, segments: 24 })),
      ),
    )
  }

  return solid
}
