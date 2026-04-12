import type { ProcessId } from '../data/processes'
import { PROCESS_PRESETS } from '../data/processes'
import type { TemplateParameter } from '../types/template'
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
  /** Template id — enables template-specific hard checks. */
  readonly templateId?: string
  /** Angle bracket: inner bend radius must stay strictly below plate thickness for a valid bend. */
  readonly innerBendRadiusMm?: number
  /** U-channel: each flange must be taller than wall thickness. */
  readonly leftFlangeHeightMm?: number
  readonly rightFlangeHeightMm?: number
  /** Angle bracket: legs must be positive lengths. */
  readonly leg1LengthMm?: number
  readonly leg2LengthMm?: number
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

  if (ctx.wallThicknessMm <= 0) {
    findings.push({
      code: 'wall-nonpositive',
      severity: 'error',
      message: 'Wall thickness must be greater than zero for a printable solid model.',
    })
  } else if (ctx.wallThicknessMm < proc.minUnsupportedWallMm) {
    findings.push({
      code: 'wall-thin',
      severity: 'warning',
      message: `Wall ${ctx.wallThicknessMm.toFixed(2)} mm is below typical minimum (${proc.minUnsupportedWallMm} mm) for ${proc.label}.`,
    })
  }

  if (ctx.templateId === 'l-bracket') {
    if (ctx.innerBendRadiusMm !== undefined && ctx.wallThicknessMm > 0 && ctx.innerBendRadiusMm >= ctx.wallThicknessMm) {
      findings.push({
        code: 'inner-bend-vs-thickness',
        severity: 'error',
        message:
          'Inner bend radius must be less than plate thickness (otherwise the bend profile collapses and the mesh is invalid).',
      })
    }
    if (ctx.leg1LengthMm !== undefined && ctx.leg1LengthMm <= 0) {
      findings.push({
        code: 'leg1-nonpositive',
        severity: 'error',
        message: 'Leg 1 length must be greater than zero.',
      })
    }
    if (ctx.leg2LengthMm !== undefined && ctx.leg2LengthMm <= 0) {
      findings.push({
        code: 'leg2-nonpositive',
        severity: 'error',
        message: 'Leg 2 length must be greater than zero.',
      })
    }
  }

  if (ctx.templateId === 'u-channel') {
    const left = ctx.leftFlangeHeightMm
    const right = ctx.rightFlangeHeightMm
    if (
      left !== undefined &&
      right !== undefined &&
      ctx.wallThicknessMm > 0 &&
      (ctx.wallThicknessMm >= left || ctx.wallThicknessMm >= right)
    ) {
      findings.push({
        code: 'u-channel-flange-vs-thickness',
        severity: 'error',
        message:
          'Wall thickness must be less than each flange height (otherwise flanges disappear and the solid is invalid).',
      })
    }
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

/**
 * Values outside each parameter's documented min/max are treated as errors so downloads can be blocked
 * consistently with HTML `min`/`max` on inputs.
 */
export function computeParamRangeFindings(
  visibleParams: readonly TemplateParameter[],
  watched: Record<string, unknown>,
): EngineeringFinding[] {
  const out: EngineeringFinding[] = []
  for (const p of visibleParams) {
    if (p.type !== 'number' && p.type !== 'integer') continue
    const raw = watched[p.key]
    const v = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isNaN(v)) continue
    if (p.min !== undefined && v < p.min) {
      out.push({
        code: `range-${p.key}-min`,
        severity: 'error',
        message: `${p.label} is below the minimum (${p.min} ${p.unit ?? ''}).`.trim(),
      })
    }
    if (p.max !== undefined && v > p.max) {
      out.push({
        code: `range-${p.key}-max`,
        severity: 'error',
        message: `${p.label} is above the maximum (${p.max} ${p.unit ?? ''}).`.trim(),
      })
    }
  }
  return out
}

/** Same range rules for the custom hole-diameter field (not always present in template JSON). */
export function computeCustomHoleRangeFinding(
  mountingBolt: string,
  holeDiameter: number | undefined,
): EngineeringFinding[] {
  if (mountingBolt !== 'custom' || holeDiameter === undefined || Number.isNaN(holeDiameter)) return []
  const min = 2
  const max = 20
  if (holeDiameter < min) {
    return [
      {
        code: 'range-holeDiameter-min',
        severity: 'error',
        message: `Custom hole diameter is below the minimum (${min} mm).`,
      },
    ]
  }
  if (holeDiameter > max) {
    return [
      {
        code: 'range-holeDiameter-max',
        severity: 'error',
        message: `Custom hole diameter is above the maximum (${max} mm).`,
      },
    ]
  }
  return []
}
