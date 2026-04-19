import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { countersinkIncludedAngleDegForBolt, resolveClearanceHoleDiameterMm } from '../data/mountingHardware'
import { generateFlatPlate } from './flatPlate'
import { generateFrenchCleat } from './frenchCleat'
import { generateLBracket } from './lBracket'
import { generatePipeSaddleClamp } from './pipeSaddleClamp'
import { generateShelfBracket } from './shelfBracket'
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

function str(r: ParamRecord, key: string, fallback: string): string {
  const v = r[key]
  return typeof v === 'string' ? v : fallback
}

/** Keys consumed by the UI / validation — not passed to JSCAD builders. */
const UI_KEYS = new Set(['processId', 'mountingBolt'])

/**
 * Applies bolt preset → hole diameter, then strips UI-only keys.
 */
export function prepareGeneratorParams(raw: ParamRecord): ParamRecord {
  const out: ParamRecord = { ...raw }
  const bolt = String(out.mountingBolt ?? 'custom')
  const customD = num(out, 'holeDiameter', num(out, 'mountHoleDiameter', 4.5))
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
    case 'shelfBracket':
      return generateShelfBracket({
        wallLegHeight: num(p, 'wallLegHeight', 80),
        shelfLegLength: num(p, 'shelfLegLength', 100),
        width: num(p, 'width', 12),
        legThickness: num(p, 'legThickness', 4),
        style: str(p, 'style', 'triangular') === 'l-shaped' ? 'l-shaped' : 'triangular',
        lighteningCutout: bool(p, 'lighteningCutout', true),
        holeDiameter: num(p, 'holeDiameter', 4.5),
        wallHoleCount: int(p, 'wallHoleCount', 2),
        shelfHoleCount: int(p, 'shelfHoleCount', 2),
        edgeOffset: num(p, 'edgeOffset', 10),
        wallHoleCountersunk: bool(p, 'wallHoleCountersunk', true),
        screwAccessSlots: bool(p, 'screwAccessSlots', true),
        screwAccessSlotDiameter: num(p, 'screwAccessSlotDiameter', 8),
        slottedWallHoles: bool(p, 'slottedWallHoles', false),
        slotOversizeMm: num(p, 'slotOversizeMm', 3),
        xyHoleCompensation: num(p, 'xyHoleCompensation', 0.1),
        minHoleEdgeClearance: num(p, 'minHoleEdgeClearance', 3),
        countersinkIncludedAngleDeg: num(p, 'countersinkIncludedAngleDeg', 90),
      })
    case 'frenchCleat':
      return generateFrenchCleat({
        cleatType: str(p, 'cleatType', 'wall') === 'item' ? 'item' : 'wall',
        length: num(p, 'length', 80),
        boardThickness: num(p, 'boardThickness', 18),
        totalHeight: num(p, 'totalHeight', 50),
        wedgeAngle: num(p, 'wedgeAngle', 45),
        printTolerance: num(p, 'printTolerance', 0.3),
        holeDiameter: num(p, 'holeDiameter', 4.5),
        holeCount: int(p, 'holeCount', 2),
        edgeOffset: num(p, 'edgeOffset', 12),
        countersunkHoles: bool(p, 'countersunkHoles', true),
        slottedHoles: bool(p, 'slottedHoles', false),
        slotOversizeMm: num(p, 'slotOversizeMm', 3),
        xyHoleCompensation: num(p, 'xyHoleCompensation', 0.1),
        minHoleEdgeClearance: num(p, 'minHoleEdgeClearance', 3),
        countersinkIncludedAngleDeg: num(p, 'countersinkIncludedAngleDeg', 90),
      })
    case 'pipeSaddleClamp':
      return generatePipeSaddleClamp({
        pipeDiameter: num(p, 'pipeDiameter', 25),
        strapWidth: num(p, 'strapWidth', 18),
        strapThickness: num(p, 'strapThickness', 3),
        tabLength: num(p, 'tabLength', 14),
        baseThickness: num(p, 'baseThickness', 4),
        pipeLift: num(p, 'pipeLift', 0),
        wrapAngle: num(p, 'wrapAngle', 180),
        pipeClearance: num(p, 'pipeClearance', 0.3),
        mountHoleDiameter: num(p, 'holeDiameter', 4.5),
        mountHoleCount: int(p, 'mountHoleCount', 1),
        edgeOffset: num(p, 'edgeOffset', 5),
        countersunkHoles: bool(p, 'countersunkHoles', true),
        slottedHoles: bool(p, 'slottedHoles', false),
        slotOversizeMm: num(p, 'slotOversizeMm', 2),
        buttressed: bool(p, 'buttressed', false),
        buttressHeight: num(p, 'buttressHeight', 10),
        buttressThickness: num(p, 'buttressThickness', 2),
        bridgeSupport: bool(p, 'bridgeSupport', false),
        xyHoleCompensation: num(p, 'xyHoleCompensation', 0.1),
        minHoleEdgeClearance: num(p, 'minHoleEdgeClearance', 2),
        countersinkIncludedAngleDeg: num(p, 'countersinkIncludedAngleDeg', 90),
      })
    default:
      throw new Error(`Unknown generation strategy: ${strategy}`)
  }
}
