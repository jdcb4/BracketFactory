import { booleans, extrusions, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { union } = booleans
const { extrudeLinear } = extrusions
const { polygon, cuboid } = primitives
const { translate, rotateY } = transforms

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
  edgeChamfer: number
  bridgeSupport: boolean
  xyHoleCompensation: number
  minHoleEdgeClearance: number
  countersinkIncludedAngleDeg?: number
}

function arcPoints(r: number, zc: number, alpha: number, steps: number, clockwise: boolean): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const u = clockwise ? i / steps : 1 - i / steps
    const t = -alpha + 2 * alpha * u
    out.push([r * Math.sin(t), zc - r * Math.cos(t)])
  }
  return out
}

/**
 * Pipe saddle: annular sector strap + flat base with side tabs (holes along X on each tab).
 */
export function generatePipeSaddleClamp(p: PipeSaddleClampParams): Geom3 {
  const W = p.strapWidth
  const Ri = Math.max(1, (p.pipeDiameter + p.pipeClearance) / 2)
  const Ro = Ri + p.strapThickness
  const baseT = p.baseThickness
  const lift = Math.max(0, p.pipeLift)
  const zc = baseT + lift + Ri
  const α = ((p.wrapAngle / 2) * Math.PI) / 180

  const steps = 32
  const outerFwd = arcPoints(Ro, zc, α, steps, true)
  const innerBack = arcPoints(Ri, zc, α, steps, false)
  const pts: [number, number][] = [...outerFwd, ...innerBack]

  let strap: Geom3 = extrudeLinear({ height: W }, polygon({ points: pts }))
  strap = rotateY(-Math.PI / 2, strap)
  strap = translate([0, 0, baseT], strap)

  const tabReach = Ro + p.tabLength
  const base: Geom3 = translate([W / 2, 0, baseT / 2], cuboid({ size: [W, 2 * tabReach, baseT] }))

  let solid: Geom3 = union(base, strap)

  // Simple side buttresses: thin boxes at x≈0 and x≈W along the outer Y edges.
  if (p.buttressed && p.buttressHeight > 1 && p.buttressThickness > 0.3) {
    const bh = Math.min(p.buttressHeight, zc - baseT)
    const bt = Math.min(p.buttressThickness, W * 0.35)
    const y0 = tabReach - bt / 2
    const plate = cuboid({ size: [bt, bt, bh] })
    solid = union(
      solid,
      translate([bt / 2, y0, baseT + bh / 2], plate),
      translate([W - bt / 2, y0, baseT + bh / 2], plate),
    )
  }

  const holeR = Math.max(0.15, p.mountHoleDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const xs = holeCenters1dGrid(Math.round(p.mountHoleCount), W, p.edgeOffset, 0, holeR, minE)
  const yHole = Math.max(minE + holeR, tabReach - p.edgeOffset)
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

  if (p.bridgeSupport) {
    const span = Math.max(0, zc - Ri - baseT - 1)
    if (span > 2) {
      const strut = translate(
        [W / 2, 0, baseT + span / 2],
        cuboid({ size: [Math.min(3, W * 0.15), Math.min(4, tabReach * 0.2), span] }),
      )
      solid = union(solid, strut)
    }
  }

  void p.edgeChamfer

  return solid
}
