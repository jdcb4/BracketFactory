/**
 * Countersink cone parameters for flat-head screws.
 * - Included angle: 90° for typical metric flat heads, 82° for common imperial flat heads.
 * - Outer opening is capped so the countersink diameter does not exceed 1.5× the through-hole diameter.
 * - Depth per face is capped at half the stock thickness so cones from opposite faces never meet.
 */

/** Outer radius (at the surface) and axial depth for one countersink cone from one face. */
export function computeCountersinkOuterRadiusAndDepth(
  holeRadiusMm: number,
  thicknessMm: number,
  includedAngleDeg: number,
): { outerRadiusMm: number; depthMm: number } {
  const r = Math.max(0.15, holeRadiusMm)
  const t = Math.max(0.2, thicknessMm)
  // Included angle φ of the cone; half-angle from the hole axis is φ/2.
  const phiRad = (includedAngleDeg * Math.PI) / 180
  const tanHalf = Math.tan(phiRad / 2)

  // Max outer *diameter* = 1.5 × hole diameter → max outer radius = 1.5 × hole radius.
  const maxOuterR = 1.5 * r
  let depth = (maxOuterR - r) / tanHalf
  const maxDepth = t / 2
  depth = Math.min(depth, maxDepth)
  const outerRadiusMm = r + depth * tanHalf
  return { outerRadiusMm, depthMm: depth }
}
