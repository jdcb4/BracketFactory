/**
 * Common aluminum extrusion profile presets (2020, 3030, 4040). Sizes in mm.
 */

export type ExtrusionProfileId = '2020' | '3030' | '4040'

export interface ExtrusionProfile {
  readonly id: ExtrusionProfileId
  /** Nominal slot opening width (mm). */
  readonly slotWidthMm: number
  /** Depth of T-slot pocket from outer face (mm). */
  readonly slotDepthMm: 6 | 8 | 10
  /** Center-to-center of slots on a 20/30/40 face grid. */
  readonly gridMm: number
}

export const EXTRUSION_PROFILES: readonly ExtrusionProfile[] = [
  { id: '2020', slotWidthMm: 6, slotDepthMm: 6, gridMm: 20 },
  { id: '3030', slotWidthMm: 8, slotDepthMm: 8, gridMm: 30 },
  { id: '4040', slotWidthMm: 8, slotDepthMm: 10, gridMm: 40 },
] as const

export function getExtrusionProfile(id: ExtrusionProfileId): ExtrusionProfile {
  const p = EXTRUSION_PROFILES.find((e) => e.id === id)
  if (!p) throw new Error(`Unknown profile ${id}`)
  return p
}
