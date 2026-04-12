/**
 * Process / material presets for guardrails (§11). Values are guidance, not guarantees.
 */

export type ProcessId =
  | 'fdm_pla_abs'
  | 'fdm_tpu'
  | 'sla_dlp'
  | 'sls_pa12'
  | 'dmls'

export interface ProcessPreset {
  readonly id: ProcessId
  readonly label: string
  /** Minimum wall that validation will accept without warning (mm). */
  readonly minSupportedWallMm: number
  /** Stricter minimum for load-bearing / unsupported walls (mm). */
  readonly minUnsupportedWallMm: number
  readonly notes: string
}

export const PROCESS_PRESETS: readonly ProcessPreset[] = [
  {
    id: 'fdm_pla_abs',
    label: 'FDM — PLA / ABS',
    minSupportedWallMm: 0.8,
    minUnsupportedWallMm: 1.2,
    notes: 'Strong practical default for brackets: 2.0–3.0 mm walls.',
  },
  {
    id: 'fdm_tpu',
    label: 'FDM — TPU',
    minSupportedWallMm: 2.0,
    minUnsupportedWallMm: 2.0,
    notes: 'Flexible materials need thicker sections.',
  },
  {
    id: 'sla_dlp',
    label: 'SLA / DLP',
    minSupportedWallMm: 0.2,
    minUnsupportedWallMm: 0.5,
    notes: 'Thin walls can be brittle.',
  },
  {
    id: 'sls_pa12',
    label: 'SLS — Nylon PA12',
    minSupportedWallMm: 0.3,
    minUnsupportedWallMm: 0.6,
    notes: 'Powder processes allow thinner horizontal details.',
  },
  {
    id: 'dmls',
    label: 'DMLS (metal)',
    minSupportedWallMm: 1.0,
    minUnsupportedWallMm: 2.0,
    notes: 'Metal varies with heat treatment and orientation.',
  },
] as const
