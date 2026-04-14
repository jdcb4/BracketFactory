import { booleans, extrusions, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { holeCenters1dGrid, subtractThroughHole } from '../geometry/holeOps'

const { union, subtract } = booleans
const { extrudeLinear } = extrusions
const { polygon, cuboid, cylinder } = primitives
const { translate, rotateX, mirrorZ } = transforms

export interface ShelfBracketParams {
  wallLegHeight: number
  shelfLegLength: number
  width: number
  legThickness: number
  style: 'triangular' | 'l-shaped'
  braceThickness: number
  braceFootOffset: number
  lighteningCutout: boolean
  lighteningMargin: number
  innerFilletRadius: number
  holeDiameter: number
  wallHoleCount: number
  shelfHoleCount: number
  edgeOffset: number
  wallHoleCountersunk: boolean
  screwAccessSlots: boolean
  screwAccessSlotDiameter: number
  slottedWallHoles: boolean
  slotOversizeMm: number
  xyHoleCompensation: number
  minHoleEdgeClearance: number
  countersinkIncludedAngleDeg?: number
}

/**
 * Shelf bracket: wall leg (+Z), shelf leg (+X), optional triangular brace; extruded along Y = width.
 * Inner corner at origin; wall face at x=0, shelf bed at z=0.
 */
export function generateShelfBracket(p: ShelfBracketParams): Geom3 {
  const Hw = p.wallLegHeight
  const Ls = p.shelfLegLength
  const W = p.width
  const Lt = p.legThickness
  const holeR = Math.max(0.15, p.holeDiameter / 2 + p.xyHoleCompensation)
  const minE = p.minHoleEdgeClearance
  const csDeg = p.countersinkIncludedAngleDeg ?? 90

  const wall = cuboid({ size: [Lt, W, Hw] })
  const shelf = cuboid({ size: [Ls, W, Lt] })
  let solid: Geom3 = union(wall, shelf)

  const triangular = p.style === 'triangular'
  if (triangular) {
    const bf = Math.max(0, p.braceFootOffset)
    const z0 = Math.max(Lt, bf)
    // Non-collinear triangle: point up the wall inner face, shelf inner line, inner corner (Lt, Lt).
    const zA = Math.min(Math.max(Hw - 0.5, Lt + 1), Math.max(z0 + 1, Lt + Hw * 0.38))
    const brace2d = polygon({
      points: [
        [Lt, zA],
        [Math.max(Lt + 0.5, Ls - 0.25), Lt],
        [Lt, Lt],
      ],
    })
    let brace: Geom3 = extrudeLinear({ height: W }, brace2d)
    brace = rotateX(-Math.PI / 2, brace)
    brace = mirrorZ(brace)
    solid = union(solid, brace)

    if (p.lighteningCutout && p.lighteningMargin > 0.5) {
      const cx = (Lt + Ls) / 2
      const cz = (z0 + Lt + Hw * 0.35) / 2
      const cut = translate(
        [cx, W / 2, cz],
        rotateX(-Math.PI / 4, cuboid({ size: [(Ls - Lt) * 0.35, W * Math.max(0.4, 1 - p.lighteningMargin / 40), (Hw - Lt) * 0.35] })),
      )
      solid = subtract(solid, cut)
    }
  }

  void p.innerFilletRadius
  void p.braceThickness

  const wallN = Math.max(1, Math.round(p.wallHoleCount))
  const zs = holeCenters1dGrid(wallN, Hw, p.edgeOffset, 0, holeR, minE)
  const wallSlot = p.slottedWallHoles ? Math.max(0, p.slotOversizeMm) : 0
  for (const z of zs) {
    solid = subtractThroughHole(
      solid,
      [Lt / 2, W / 2, z],
      holeR,
      Lt,
      'x',
      {
        countersunk: p.wallHoleCountersunk,
        countersinkWhich: 'neg',
        countersinkIncludedAngleDeg: csDeg,
        slotLengthExtra: wallSlot,
        slotAxis: 'z',
      },
    )
  }

  const shelfN = Math.max(0, Math.round(p.shelfHoleCount))
  if (shelfN > 0) {
    const xs = holeCenters1dGrid(shelfN, Ls, p.edgeOffset, 0, holeR, minE)
    for (const x of xs) {
      solid = subtractThroughHole(
        solid,
        [x, W / 2, Lt / 2],
        holeR,
        Lt,
        'z',
        {
          countersunk: false,
          countersinkWhich: 'both',
          countersinkIncludedAngleDeg: csDeg,
        },
      )
    }

    if (triangular && p.screwAccessSlots && p.screwAccessSlotDiameter > 2) {
      const r = p.screwAccessSlotDiameter / 2
      const zMid = Lt + (Hw - Lt) * 0.45
      for (const x of xs) {
        const access = translate(
          [x, W / 2, zMid],
          rotateX(Math.PI / 2, cylinder({ radius: r, height: W + 4, segments: 24 })),
        )
        solid = subtract(solid, access)
      }
    }
  }

  return solid
}
