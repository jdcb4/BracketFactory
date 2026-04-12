import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { countersinkIncludedAngleDegForBolt, resolveClearanceHoleDiameterMm } from '../data/mountingHardware'
import { generateExtrusionBracket } from './extrusionBracket'
import { generateFlatPlate } from './flatPlate'
import { generateLBracket } from './lBracket'
import { generateUChannel } from './uChannel'

export type ParamRecord = Record<string, string | number | boolean>

function num(r: ParamRecord, key: string, fallback = 0): number {
  const v = r[key]
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function int(r: ParamRecord, key: string, fallback = 0): number {
  return Math.round(num(r, key, fallback))
}

function bool(r: ParamRecord, key: string, fallback = false): boolean {
  const v = r[key]
  if (typeof v === 'boolean') return v
  return fallback
}

/** Keys consumed by the UI / validation — not passed to JSCAD builders. */
const UI_KEYS = new Set(['processId', 'mountingBolt'])

/**
 * Applies bolt preset → hole diameter, then strips UI-only keys.
 */
export function prepareGeneratorParams(raw: ParamRecord): ParamRecord {
  const out: ParamRecord = { ...raw }
  const bolt = String(out.mountingBolt ?? 'custom')
  const customD = num(out, 'holeDiameter', 4.5)
  out.holeDiameter = resolveClearanceHoleDiameterMm(bolt, customD)
  out.countersinkIncludedAngleDeg = countersinkIncludedAngleDegForBolt(bolt)
  for (const k of UI_KEYS) {
    delete out[k]
  }
  return out
}

function lBracketParams(p: ParamRecord) {
  return {
    gusseted: bool(p, 'gusseted', false),
    gussetHeight: num(p, 'gussetHeight', 12),
    gussetThickness: num(p, 'gussetThickness', 2),
    gussetCount: int(p, 'gussetCount', 2),
    leg1Length: num(p, 'leg1Length', 40),
    leg2Length: num(p, 'leg2Length', 40),
    width: num(p, 'width', 20),
    thickness: num(p, 'thickness', 3),
    innerBendRadius: num(p, 'innerBendRadius', 1),
    outerFilletRadius: num(p, 'outerFilletRadius', 1),
    holeDiameter: num(p, 'holeDiameter', 4.5),
    holeCountLeg1: int(p, 'holeCountLeg1', 2),
    holeCountLeg2: int(p, 'holeCountLeg2', 2),
    holeRows: int(p, 'holeRows', 1),
    edgeOffset: num(p, 'edgeOffset', 6),
    xyHoleCompensation: num(p, 'xyHoleCompensation', 0.1),
    minHoleEdgeClearance: num(p, 'minHoleEdgeClearance', 2),
    countersunkHoles: bool(p, 'countersunkHoles', false),
    slottedHoles: bool(p, 'slottedHoles', false),
    slotOversizeMm: num(p, 'slotOversizeMm', 2),
    countersinkIncludedAngleDeg: num(p, 'countersinkIncludedAngleDeg', 90),
  }
}

/**
 * Maps `generationStrategy` from template JSON to a JSCAD `geom3` builder.
 */
export function generateFromStrategy(strategy: string, raw: ParamRecord): Geom3 {
  const p = prepareGeneratorParams(raw)
  switch (strategy) {
    case 'lBracket':
      return generateLBracket(lBracketParams(p))
    case 'cornerBracket':
      // Legacy strategy id — same generator as angle bracket.
      return generateLBracket(lBracketParams(p))
    case 'flatPlate':
      return generateFlatPlate({
        length: num(p, 'length', 60),
        width: num(p, 'width', 20),
        thickness: num(p, 'thickness', 3),
        holesAlongLength: int(p, 'holesAlongLength', int(p, 'holeRows', 2)),
        holesAlongWidth: int(p, 'holesAlongWidth', int(p, 'holeCols', 2)),
        holeDiameter: num(p, 'holeDiameter', 4.5),
        holeSpacingX: num(p, 'holeSpacingX', 0),
        holeSpacingY: num(p, 'holeSpacingY', 0),
        edgeOffsetX: num(p, 'edgeOffsetX', 8),
        edgeOffsetY: num(p, 'edgeOffsetY', 6),
        xyHoleCompensation: num(p, 'xyHoleCompensation', 0.1),
        minHoleEdgeClearance: num(p, 'minHoleEdgeClearance', 2),
        countersunkHoles: bool(p, 'countersunkHoles', false),
        slottedHoles: bool(p, 'slottedHoles', false),
        slotOversizeMm: num(p, 'slotOversizeMm', 2),
        countersinkIncludedAngleDeg: num(p, 'countersinkIncludedAngleDeg', 90),
      })
    case 'uChannel':
      return generateUChannel({
        baseWidth: num(p, 'baseWidth', 40),
        leftFlangeHeight: num(p, 'leftFlangeHeight', 20),
        rightFlangeHeight: num(p, 'rightFlangeHeight', 20),
        thickness: num(p, 'thickness', 3),
        length: num(p, 'length', 50),
        holeDiameter: num(p, 'holeDiameter', 4.5),
        holesPerFlange: int(p, 'holesPerFlange', 2),
        edgeOffset: num(p, 'edgeOffset', 8),
        xyHoleCompensation: num(p, 'xyHoleCompensation', 0.1),
        minHoleEdgeClearance: num(p, 'minHoleEdgeClearance', 2),
        countersunkHoles: bool(p, 'countersunkHoles', false),
        slottedHoles: bool(p, 'slottedHoles', false),
        slotOversizeMm: num(p, 'slotOversizeMm', 2),
        countersinkIncludedAngleDeg: num(p, 'countersinkIncludedAngleDeg', 90),
      })
    case 'extrusionBracket':
      return generateExtrusionBracket({
        profile: (p.profile === '3030' || p.profile === '4040' ? p.profile : '2020') as
          | '2020'
          | '3030'
          | '4040',
        armLength: num(p, 'armLength', 40),
        thickness: num(p, 'thickness', 4),
        ridgeClearance: num(p, 'ridgeClearance', 0.2),
        holeDiameter: num(p, 'holeDiameter', 4.5),
        holeCount: int(p, 'holeCount', 2),
        holeRows: int(p, 'holeRows', 1),
        edgeOffset: num(p, 'edgeOffset', 8),
        xyHoleCompensation: num(p, 'xyHoleCompensation', 0.1),
        minHoleEdgeClearance: num(p, 'minHoleEdgeClearance', 2),
        countersunkHoles: bool(p, 'countersunkHoles', false),
        slottedHoles: bool(p, 'slottedHoles', false),
        slotOversizeMm: num(p, 'slotOversizeMm', 2),
        countersinkIncludedAngleDeg: num(p, 'countersinkIncludedAngleDeg', 90),
      })
    default:
      throw new Error(`Unknown generation strategy: ${strategy}`)
  }
}
