import { booleans, extrusions, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { union } = booleans
const { extrudeLinear } = extrusions
const { polygon, cuboid } = primitives
const { translate, rotateX, rotateY } = transforms

export interface PipeSaddleClampParams {
  pipeDiameter: number
  strapWidth: number
  strapThickness: number
  tabLength: number
  baseThickness: number
  pipeLift: number
  wrapAngle: number
  pipeClearance: number
  mountHoleDiameter: number
  mountHoleCount: number
  edgeOffset: number
  countersunkHoles: boolean
  slottedHoles: boolean
  slotOversizeMm: number
  buttressed: boolean
  buttressHeight: number
  buttressThickness: number
  bridgeSupport: boolean
  xyHoleCompensation: number
  minHoleEdgeClearance: number
  countersinkIncludedAngleDeg?: number
}

/** Points on an arc of radius r centred on (0, zc), swept from −α to +α. `forward` flips direction. */
function arcPoints(
  r: number,
  zc: number,
  alpha: number,
  steps: number,
  forward: boolean,
): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const u = forward ? i / steps : 1 - i / steps
    const t = -alpha + 2 * alpha * u
    out.push([r * Math.sin(t), zc - r * Math.cos(t)])
  }
  return out
}

/**
 * Map a polygon-in-(y_b, z_b) + extrusion-along-Z solid onto the final bracket frame where the
 * extrusion axis becomes +x_b. This is the same rotation pair used by the French cleat — it avoids
 * a subtle bug where `rotateY(-π/2)` leaves the extrusion on −X and every downstream operation
 * (unions, hole placements) silently misaligns.
 */
function alignYZExtrusionToX(solid: Geom3): Geom3 {
  return rotateX(Math.PI / 2, rotateY(Math.PI / 2, solid))
}

/**
 * Pipe saddle clamp: open cradle that catches a round pipe from below, with a flat base and side
 * tabs for screw-down mounting. Pipe axis runs along +X; base sits flat on the bed (z=0); saddle
 * opens upward (+Z).
 *
 * Strap cross-section is an annular sector centred at (0, zc) where zc = baseT + lift + Ri is the
 * pipe-centre height. The sector is swept ±α from vertical with α = wrapAngle/2 — so wrap = 180°
 * is a half-circle cradle, < 180° is a shallow saddle, > 180° wraps past the equator for snap
 * retention (requires a flexible material).
 */
export function generatePipeSaddleClamp(p: PipeSaddleClampParams): Geom3 {
  const W = Math.max(4, p.strapWidth)
  const strapT = Math.max(1, p.strapThickness)
  const Ri = Math.max(1, (p.pipeDiameter + p.pipeClearance) / 2)
  const Ro = Ri + strapT
  const baseT = Math.max(1, p.baseThickness)
  const lift = Math.max(0, p.pipeLift)
  const zc = baseT + lift + Ri
  const wrapDeg = Math.min(270, Math.max(120, p.wrapAngle))
  const alpha = ((wrapDeg / 2) * Math.PI) / 180

  // Annular sector polygon walked outer-forward then inner-back so winding is CCW.
  const steps = 48
  const pts: [number, number][] = [
    ...arcPoints(Ro, zc, alpha, steps, true),
    ...arcPoints(Ri, zc, alpha, steps, false),
  ]

  let strap: Geom3 = extrudeLinear({ height: W }, polygon({ points: pts }))
  strap = alignYZExtrusionToX(strap)

  const tabReach = Ro + Math.max(2, p.tabLength)
  const base: Geom3 = translate([W / 2, 0, baseT / 2], cuboid({ size: [W, 2 * tabReach, baseT] }))
  let solid: Geom3 = union(base, strap)

  // Triangular gussets (buttresses): a right-triangle rib on each Y side, at each X end of the
  // strap. Rib braces the saddle's outer-arc endpoint down to the base top, extending outward
  // along +Y (or −Y) by buttressHeight. Extrudes along +X for buttressThickness — so a 2020-style
  // corner gusset, not a floating cube.
  if (p.buttressed && p.buttressHeight > 1 && p.buttressThickness > 0.3) {
    const availOutward = Math.max(0, tabReach - Ro * Math.sin(alpha) - 1)
    const bh = Math.min(p.buttressHeight, availOutward)
    const bt = Math.min(p.buttressThickness, Math.max(0.6, W * 0.5))
    if (bh > 1 && bt > 0.3) {
      const endpointY = Ro * Math.sin(alpha)
      const endpointZ = Math.max(baseT + 0.5, zc - Ro * Math.cos(alpha))
      for (const sign of [1, -1] as const) {
        // CCW triangle (y, z): saddle endpoint → directly below on base → outward on base.
        const triPts: [number, number][] =
          sign > 0
            ? [
                [endpointY, endpointZ],
                [endpointY, baseT],
                [endpointY + bh, baseT],
              ]
            : [
                [-endpointY, endpointZ],
                [-(endpointY + bh), baseT],
                [-endpointY, baseT],
              ]
        for (const xPos of [0, W - bt]) {
          let gusset: Geom3 = extrudeLinear({ height: bt }, polygon({ points: triPts }))
          gusset = alignYZExtrusionToX(gusset)
          gusset = translate([xPos, 0, 0], gusset)
          solid = union(solid, gusset)
        }
      }
    }
  }

  // Mounting holes through the tabs, vertical (along Z). One column on each Y side of the saddle.
  const holeR = Math.max(0.15, p.mountHoleDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const xs = holeCenters1dGrid(Math.round(p.mountHoleCount), W, p.edgeOffset, 0, holeR, minE)
  // Seat the hole in the flat tab: at least (Ro + margin) from centre (clear of the saddle wall),
  // no closer than edgeOffset from the outer Y edge of the base.
  const yHoleMin = Ro + holeR + minE
  const yHoleMax = tabReach - Math.max(p.edgeOffset, holeR + minE)
  const yHole = yHoleMax >= yHoleMin ? yHoleMax : (yHoleMin + yHoleMax) / 2
  const slotExtra = p.slottedHoles ? Math.max(0, p.slotOversizeMm) : 0
  const csDeg = p.countersinkIncludedAngleDeg ?? 90

  for (const side of [-1, 1] as const) {
    for (const x of xs) {
      solid = subtractThroughHole(
        solid,
        [x, side * yHole, baseT / 2],
        holeR,
        baseT,
        'z',
        {
          countersunk: p.countersunkHoles,
          countersinkWhich: 'pos',
          countersinkIncludedAngleDeg: csDeg,
          slotLengthExtra: slotExtra,
          slotAxis: 'x',
        },
      )
    }
  }

  // Sacrificial bridge support: a thin wall at y=0 spanning from base top up to the saddle's outer
  // arc midpoint. Only relevant when there's a visible gap (i.e., lift > strapT). Snip after
  // printing — it's 0.6 mm thick, one perimeter wide.
  if (p.bridgeSupport) {
    const gap = lift - strapT
    if (gap > 1) {
      const strut = translate(
        [W / 2, 0, baseT + gap / 2],
        cuboid({ size: [Math.max(2, W - 1), 0.6, gap] }),
      )
      solid = union(solid, strut)
    }
  }

  return solid
}
