/**
 * Printability and mechanical guardrails (see docs/validation-rules.md).
 */

export type Severity = 'error' | 'warning' | 'info'

export interface EngineeringFinding {
  readonly code: string
  readonly severity: Severity
  readonly message: string
}

/** Default nozzle for FDM snapping hints (mm). */
export const DEFAULT_NOZZLE_MM = 0.4

/** Recommended wall thicknesses as multiples of nozzle (FDM). */
export const FDM_WALL_MULTIPLES = [2, 3, 4, 5] // → 0.8, 1.2, 1.6, 2.0 mm at 0.4 nozzle

/** Warn when a horizontal bridge span exceeds this (mm). */
export const BRIDGE_WARN_MM = 10

/** Minimum flange length should be ~4× thickness (rule of thumb). */
export function flangeTooShort(flangeLengthMm: number, thicknessMm: number): boolean {
  return flangeLengthMm < 4 * thicknessMm
}

export function holeTooCloseToEdge(
  holeDiameterMm: number,
  edgeDistanceMm: number,
  preferMultiple = 2,
): boolean {
  const min = holeDiameterMm
  const preferred = preferMultiple * holeDiameterMm
  return edgeDistanceMm < min || edgeDistanceMm < preferred
}

/** Rib thickness should be ~60–80% of wall; height ≤ ~3× wall. */
export function ribDimensionsOk(ribThickness: number, wall: number, ribHeight: number): boolean {
  const tOk = ribThickness >= 0.6 * wall && ribThickness <= 0.8 * wall
  const hOk = ribHeight <= 3 * wall
  return tOk && hOk
}

export function snapWallToNozzleMultiple(
  wallMm: number,
  nozzleMm: number = DEFAULT_NOZZLE_MM,
): number {
  const step = nozzleMm
  const snapped = Math.round(wallMm / step) * step
  return Math.max(step, snapped)
}
