/**
 * Common metric & imperial bolt sizes with typical **clearance** hole diameters (mm) for 3D-printed parts.
 * Values are approximate; use "Custom" when you need an exact drill size.
 */

export type BoltPresetId =
  | 'custom'
  | 'M3'
  | 'M4'
  | 'M5'
  | 'M6'
  | 'M8'
  | 'M10'
  | 'M12'
  | 'UNC_4_40'
  | 'UNC_6_32'
  | 'UNC_8_32'
  | 'UNC_10_24'
  | 'UNC_1_4'

/** Preset id → clearance hole diameter (mm). */
export const CLEARANCE_HOLE_DIAMETER_MM: Record<Exclude<BoltPresetId, 'custom'>, number> = {
  M3: 3.2,
  M4: 4.3,
  M5: 5.3,
  M6: 6.4,
  M8: 8.4,
  M10: 10.5,
  M12: 13.0,
  // UNC: common clearance approximations in mm
  UNC_4_40: 3.0,
  UNC_6_32: 3.5,
  UNC_8_32: 4.2,
  UNC_10_24: 4.9,
  UNC_1_4: 6.6,
}

/** Dropdown labels for forms (value = BoltPresetId). */
export const MOUNTING_BOLT_SELECT_OPTIONS: readonly { value: BoltPresetId; label: string }[] = [
  { value: 'M3', label: 'M3 — clearance ~3.2 mm' },
  { value: 'M4', label: 'M4 — clearance ~4.3 mm' },
  { value: 'M5', label: 'M5 — clearance ~5.3 mm' },
  { value: 'M6', label: 'M6 — clearance ~6.4 mm' },
  { value: 'M8', label: 'M8 — clearance ~8.4 mm' },
  { value: 'M10', label: 'M10 — clearance ~10.5 mm' },
  { value: 'M12', label: 'M12 — clearance ~13.0 mm' },
  { value: 'UNC_4_40', label: '#4-40 UNC — clearance ~3.0 mm' },
  { value: 'UNC_6_32', label: '#6-32 UNC — clearance ~3.5 mm' },
  { value: 'UNC_8_32', label: '#8-32 UNC — clearance ~4.2 mm' },
  { value: 'UNC_10_24', label: '#10-24 UNC — clearance ~4.9 mm' },
  { value: 'UNC_1_4', label: '1/4 in.-20 UNC — clearance ~6.6 mm' },
  { value: 'custom', label: 'Custom — use hole diameter field' },
]

/**
 * Effective through-hole diameter from preset, or `holeDiameter` when preset is custom / unknown.
 */
export function resolveClearanceHoleDiameterMm(
  mountingBolt: string | undefined,
  holeDiameter: number,
): number {
  if (mountingBolt === undefined || mountingBolt === '' || mountingBolt === 'custom') return holeDiameter
  const d = CLEARANCE_HOLE_DIAMETER_MM[mountingBolt as keyof typeof CLEARANCE_HOLE_DIAMETER_MM]
  return typeof d === 'number' ? d : holeDiameter
}

/** Metric presets use 90° included countersink angle; UNC/imperial presets use 82°. Custom defaults to metric-style 90°. */
export function countersinkIncludedAngleDegForBolt(mountingBolt: string | undefined): number {
  const b = mountingBolt ?? 'custom'
  if (b === 'custom' || b === '') return 90
  if (b.startsWith('M')) return 90
  return 82
}
