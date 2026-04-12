import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { generateExtrusionBracket } from './extrusionBracket'
import { generateFlatPlate } from './flatPlate'
import { generateGussetedCorner } from './gussetedCorner'
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

/**
 * Maps `generationStrategy` from template JSON to a JSCAD `geom3` builder.
 */
export function generateFromStrategy(strategy: string, raw: ParamRecord): Geom3 {
  switch (strategy) {
    case 'lBracket':
      return generateLBracket({
        leg1Length: num(raw, 'leg1Length', 40),
        leg2Length: num(raw, 'leg2Length', 40),
        width: num(raw, 'width', 20),
        thickness: num(raw, 'thickness', 3),
        innerBendRadius: num(raw, 'innerBendRadius', 1),
        outerFilletRadius: num(raw, 'outerFilletRadius', 1),
        holeDiameter: num(raw, 'holeDiameter', 4.5),
        holeCountLeg1: int(raw, 'holeCountLeg1', 2),
        holeCountLeg2: int(raw, 'holeCountLeg2', 2),
        edgeOffset: num(raw, 'edgeOffset', 6),
        xyHoleCompensation: num(raw, 'xyHoleCompensation', 0.1),
      })
    case 'gussetedCorner':
      return generateGussetedCorner({
        leg1Length: num(raw, 'leg1Length', 40),
        leg2Length: num(raw, 'leg2Length', 40),
        width: num(raw, 'width', 20),
        thickness: num(raw, 'thickness', 3),
        gussetHeight: num(raw, 'gussetHeight', 12),
        gussetThickness: num(raw, 'gussetThickness', 2),
        gussetCount: int(raw, 'gussetCount', 2),
        holeDiameter: num(raw, 'holeDiameter', 4.5),
        holeCountLeg1: int(raw, 'holeCountLeg1', 2),
        holeCountLeg2: int(raw, 'holeCountLeg2', 2),
        edgeOffset: num(raw, 'edgeOffset', 6),
        xyHoleCompensation: num(raw, 'xyHoleCompensation', 0.1),
      })
    case 'flatPlate':
      return generateFlatPlate({
        length: num(raw, 'length', 60),
        width: num(raw, 'width', 20),
        thickness: num(raw, 'thickness', 3),
        holeRows: int(raw, 'holeRows', 2),
        holeCols: int(raw, 'holeCols', 2),
        holeDiameter: num(raw, 'holeDiameter', 4.5),
        holeSpacingX: num(raw, 'holeSpacingX', 0),
        holeSpacingY: num(raw, 'holeSpacingY', 0),
        edgeOffsetX: num(raw, 'edgeOffsetX', 8),
        edgeOffsetY: num(raw, 'edgeOffsetY', 6),
        xyHoleCompensation: num(raw, 'xyHoleCompensation', 0.1),
      })
    case 'uChannel':
      return generateUChannel({
        baseWidth: num(raw, 'baseWidth', 40),
        leftFlangeHeight: num(raw, 'leftFlangeHeight', 20),
        rightFlangeHeight: num(raw, 'rightFlangeHeight', 20),
        thickness: num(raw, 'thickness', 3),
        length: num(raw, 'length', 50),
        holeDiameter: num(raw, 'holeDiameter', 4.5),
        holesPerFlange: int(raw, 'holesPerFlange', 2),
        edgeOffset: num(raw, 'edgeOffset', 8),
        xyHoleCompensation: num(raw, 'xyHoleCompensation', 0.1),
      })
    case 'extrusionBracket':
      return generateExtrusionBracket({
        profile: (raw.profile === '3030' || raw.profile === '4040' ? raw.profile : '2020') as
          | '2020'
          | '3030'
          | '4040',
        armLength: num(raw, 'armLength', 40),
        thickness: num(raw, 'thickness', 4),
        ridgeClearance: num(raw, 'ridgeClearance', 0.2),
        holeDiameter: num(raw, 'holeDiameter', 4.5),
        holeCount: int(raw, 'holeCount', 2),
        edgeOffset: num(raw, 'edgeOffset', 8),
        xyHoleCompensation: num(raw, 'xyHoleCompensation', 0.1),
      })
    default:
      throw new Error(`Unknown generation strategy: ${strategy}`)
  }
}
