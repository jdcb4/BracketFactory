import { booleans, hulls, primitives, transforms } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { computeCountersinkOuterRadiusAndDepth } from './countersink'

const { subtract } = booleans
const { hull } = hulls
const { cylinder, cylinderElliptic } = primitives
const { translate, rotateX, rotateY } = transforms

/** Minimum material from hole edge to part edge (mm) — enforced when placing holes. */
export const DEFAULT_MIN_EDGE_CLEARANCE_MM = 2.0

export function clamp1d(
  value: number,
  holeRadius: number,
  minEdge: number,
  extent: number,
): number {
  const lo = holeRadius + minEdge
  const hi = extent - holeRadius - minEdge
  if (hi < lo) return extent / 2
  return Math.min(Math.max(value, lo), hi)
}

/**
 * Hole centers along one axis (0..extent). Respects `edgeOff` as minimum inset from each end when
 * spacing is auto; enforces at least `holeRadius + minEdge` from each stock edge.
 */
export function holeCenters1dGrid(
  count: number,
  extent: number,
  edgeOff: number,
  spacing: number,
  holeRadius: number,
  minEdge: number,
): number[] {
  if (count <= 0) return []
  const margin = Math.max(edgeOff, holeRadius + minEdge)
  const lo = margin
  const hi = extent - margin
  if (hi < lo) return [extent / 2]
  if (count === 1) return [(lo + hi) / 2]
  if (spacing > 0) {
    return Array.from({ length: count }, (_, i) =>
      clamp1d(edgeOff + i * spacing, holeRadius, minEdge, extent),
    )
  }
  const span = hi - lo
  return Array.from({ length: count }, (_, i) => lo + (span * i) / (count - 1))
}

export type HoleAxis = 'x' | 'y' | 'z'

/**
 * Which face(s) get the wider countersink opening (screw enters from that side).
 * - `both`: typical pan-head / access from both sides
 * - `pos`: only the +axis face (e.g. +X = outside of vertical leg)
 * - `neg`: only the −axis face
 */
export type CountersinkWhich = 'both' | 'pos' | 'neg'

export interface ThroughHoleOptions {
  countersunk?: boolean
  countersinkWhich?: CountersinkWhich
  /** Included cone angle (degrees): 90 metric-style, 82 imperial flat-head typical. */
  countersinkIncludedAngleDeg?: number
  /** Elongated hole: extra length (mm) along slot direction (rounded capsule). */
  slotLengthExtra?: number
  /** Axis along which the slot is elongated (in world coordinates). */
  slotAxis?: 'x' | 'y' | 'z'
}

function frustumAlongZ(z0: number, z1: number, r0: number, r1: number, cx: number, cy: number): Geom3 {
  const h = Math.abs(z1 - z0)
  if (h < 1e-6) return translate([cx, cy, z0], cylinder({ radius: r0, height: 0.01, segments: 24 }))
  const lo = Math.min(z0, z1)
  const hi = Math.max(z0, z1)
  const bottom = lo === z0 ? r0 : r1
  const top = lo === z0 ? r1 : r0
  return translate(
    [cx, cy, (lo + hi) / 2],
    cylinderElliptic({
      height: hi - lo,
      startRadius: [bottom, bottom],
      endRadius: [top, top],
      segments: 24,
    }),
  )
}

function frustumAlongX(x0: number, x1: number, r0: number, r1: number, cy: number, cz: number): Geom3 {
  const h = Math.abs(x1 - x0)
  if (h < 1e-6) return translate([x0, cy, cz], rotateY(Math.PI / 2, cylinder({ radius: r0, height: 0.01, segments: 24 })))
  const lo = Math.min(x0, x1)
  const hi = Math.max(x0, x1)
  const bottom = lo === x0 ? r0 : r1
  const top = lo === x0 ? r1 : r0
  return translate(
    [(lo + hi) / 2, cy, cz],
    rotateY(
      Math.PI / 2,
      cylinderElliptic({
        height: hi - lo,
        startRadius: [bottom, bottom],
        endRadius: [top, top],
        segments: 24,
      }),
    ),
  )
}

function frustumAlongY(y0: number, y1: number, r0: number, r1: number, cx: number, cz: number): Geom3 {
  const h = Math.abs(y1 - y0)
  if (h < 1e-6) return translate([cx, y0, cz], rotateX(Math.PI / 2, cylinder({ radius: r0, height: 0.01, segments: 24 })))
  const lo = Math.min(y0, y1)
  const hi = Math.max(y0, y1)
  const bottom = lo === y0 ? r0 : r1
  const top = lo === y0 ? r1 : r0
  return translate(
    [cx, (lo + hi) / 2, cz],
    rotateX(
      Math.PI / 2,
      cylinderElliptic({
        height: hi - lo,
        startRadius: [bottom, bottom],
        endRadius: [top, top],
        segments: 24,
      }),
    ),
  )
}

/**
 * Capsule: hull of two cylinders, axis aligned with the through-hole.
 */
function slotCutterCapsule(
  center: readonly [number, number, number],
  radius: number,
  holeLen: number,
  axis: HoleAxis,
  slotAxis: 'x' | 'y' | 'z',
  slotExtra: number,
): Geom3 {
  const r = Math.max(0.15, radius)
  const half = Math.max(0, slotExtra) / 2
  const cyl = (): Geom3 => cylinder({ radius: r, height: holeLen + 8, segments: 28 })

  if (axis === 'z') {
    const ax = slotAxis === 'x'
    const o1 = ax ? [-half, 0, 0] as const : [0, -half, 0] as const
    const o2 = ax ? [half, 0, 0] as const : [0, half, 0] as const
    const a = translate([center[0] + o1[0], center[1] + o1[1], center[2]], cyl())
    const b = translate([center[0] + o2[0], center[1] + o2[1], center[2]], cyl())
    return hull(a, b)
  }
  if (axis === 'x') {
    const c = cyl()
    const rc = rotateY(Math.PI / 2, c)
    const ax = slotAxis === 'z'
    const o1 = ax ? [0, 0, -half] as const : [0, -half, 0] as const
    const o2 = ax ? [0, 0, half] as const : [0, half, 0] as const
    const a = translate([center[0] + o1[0], center[1] + o1[1], center[2] + o1[2]], rc)
    const b = translate([center[0] + o2[0], center[1] + o2[1], center[2] + o2[2]], rc)
    return hull(a, b)
  }
  const c = cyl()
  const rc = rotateX(Math.PI / 2, c)
  const ax = slotAxis === 'z'
  const o1 = ax ? [0, 0, -half] as const : [-half, 0, 0] as const
  const o2 = ax ? [0, 0, half] as const : [half, 0, 0] as const
  const a = translate([center[0] + o1[0], center[1] + o1[1], center[2] + o1[2]], rc)
  const b = translate([center[0] + o2[0], center[1] + o2[1], center[2] + o2[2]], rc)
  return hull(a, b)
}

function subtractCountersinks(
  solid: Geom3,
  center: readonly [number, number, number],
  r: number,
  thickness: number,
  axis: HoleAxis,
  which: CountersinkWhich,
  includedAngleDeg: number,
): Geom3 {
  const { outerRadiusMm: sinkR, depthMm: sinkH } = computeCountersinkOuterRadiusAndDepth(
    r,
    thickness,
    includedAngleDeg,
  )
  const [cx, cy, cz] = center
  let out = solid

  if (axis === 'z') {
    const zPos = cz + thickness / 2
    const zNeg = cz - thickness / 2
    if (which === 'both' || which === 'pos') {
      out = subtract(out, frustumAlongZ(zPos - sinkH, zPos, r, sinkR, cx, cy))
    }
    if (which === 'both' || which === 'neg') {
      out = subtract(out, frustumAlongZ(zNeg, zNeg + sinkH, sinkR, r, cx, cy))
    }
    return out
  }

  if (axis === 'x') {
    const xPos = cx + thickness / 2
    const xNeg = cx - thickness / 2
    if (which === 'both' || which === 'pos') {
      out = subtract(out, frustumAlongX(xPos - sinkH, xPos, r, sinkR, cy, cz))
    }
    if (which === 'both' || which === 'neg') {
      out = subtract(out, frustumAlongX(xNeg, xNeg + sinkH, sinkR, r, cy, cz))
    }
    return out
  }

  const yPos = cy + thickness / 2
  const yNeg = cy - thickness / 2
  if (which === 'both' || which === 'pos') {
    out = subtract(out, frustumAlongY(yPos - sinkH, yPos, r, sinkR, cx, cz))
  }
  if (which === 'both' || which === 'neg') {
    out = subtract(out, frustumAlongY(yNeg, yNeg + sinkH, sinkR, r, cx, cz))
  }
  return out
}

/**
 * Subtract a through hole along `axis` through `thickness` (centered on mid-plane).
 * Countersinks remove conical material on chosen faces (wider opening = screw entry side).
 */
export function subtractThroughHole(
  solid: Geom3,
  center: readonly [number, number, number],
  radius: number,
  thickness: number,
  axis: HoleAxis,
  opts: ThroughHoleOptions = {},
): Geom3 {
  const {
    countersunk = false,
    countersinkWhich = 'both',
    countersinkIncludedAngleDeg = 90,
    slotLengthExtra = 0,
    slotAxis = 'x',
  } = opts
  const h = thickness + 6
  const r = Math.max(0.15, radius)

  let cutter: Geom3
  if (slotLengthExtra > 0.05) {
    const sa = slotAxis === 'z' && axis !== 'z' ? 'z' : slotAxis === 'y' ? 'y' : 'x'
    cutter = slotCutterCapsule(center, r, h, axis, sa as 'x' | 'y' | 'z', slotLengthExtra)
  } else {
    const cyl = cylinder({ radius: r, height: h, segments: 28 })
    if (axis === 'z') cutter = translate([center[0], center[1], center[2]], cyl)
    else if (axis === 'y') cutter = translate([center[0], center[1], center[2]], rotateX(Math.PI / 2, cyl))
    else cutter = translate([center[0], center[1], center[2]], rotateY(Math.PI / 2, cyl))
  }

  let out = subtract(solid, cutter)
  if (countersunk) {
    out = subtractCountersinks(out, center, r, thickness, axis, countersinkWhich, countersinkIncludedAngleDeg)
  }
  return out
}
