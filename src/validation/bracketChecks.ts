import type { ProcessId } from '../data/processes'
import { PROCESS_PRESETS } from '../data/processes'
import {
  BRIDGE_WARN_MM,
  type EngineeringFinding,
  flangeTooShort,
  holeTooCloseToEdge,
} from './engineering'

export interface BracketCheckContext {
  readonly processId: ProcessId
  readonly wallThicknessMm: number
  /** Longest unsupported horizontal span to check bridging (mm). */
  readonly bridgeSpanMm?: number
  readonly holeDiameterMm?: number
  readonly holeEdgeDistanceMm?: number
  readonly flangeLengthMm?: number
}

/**
 * Run cross-cutting checks for a bracket configuration.
 */
export function runBracketChecks(ctx: BracketCheckContext): EngineeringFinding[] {
  const findings: EngineeringFinding[] = []
  const proc = PROCESS_PRESETS.find((p) => p.id === ctx.processId)
  if (!proc) {
    findings.push({
      code: 'process-unknown',
      severity: 'warning',
      message: 'Unknown process preset; using generic FDM assumptions.',
    })
    return findings
  }

  if (ctx.wallThicknessMm < proc.minUnsupportedWallMm) {
    findings.push({
      code: 'wall-thin',
      severity: 'warning',
      message: `Wall ${ctx.wallThicknessMm.toFixed(2)} mm is below typical minimum (${proc.minUnsupportedWallMm} mm) for ${proc.label}.`,
    })
  }

  if (ctx.bridgeSpanMm !== undefined && ctx.bridgeSpanMm > BRIDGE_WARN_MM) {
    findings.push({
      code: 'bridge-span',
      severity: 'warning',
      message: `Unsupported horizontal span ~${ctx.bridgeSpanMm.toFixed(1)} mm may need supports (>${BRIDGE_WARN_MM} mm).`,
    })
  }

  if (
    ctx.holeDiameterMm !== undefined &&
    ctx.holeEdgeDistanceMm !== undefined &&
    holeTooCloseToEdge(ctx.holeDiameterMm, ctx.holeEdgeDistanceMm, 1)
  ) {
    findings.push({
      code: 'hole-edge',
      severity: 'error',
      message: 'Hole edge distance is below 1× hole diameter (unsafe). Increase offset or reduce hole size.',
    })
  }

  if (
    ctx.flangeLengthMm !== undefined &&
    flangeTooShort(ctx.flangeLengthMm, ctx.wallThicknessMm)
  ) {
    findings.push({
      code: 'flange-short',
      severity: 'warning',
      message: 'Flange length is shorter than ~4× thickness; consider increasing for stiffness.',
    })
  }

  return findings
}
