import { describe, expect, it } from 'vitest'
import {
  computeCustomHoleRangeFinding,
  computeParamRangeFindings,
  runBracketChecks,
} from './bracketChecks'
import type { TemplateParameter } from '../types/template'

describe('runBracketChecks', () => {
  it('errors when inner bend radius is not less than thickness (angle bracket)', () => {
    const f = runBracketChecks({
      processId: 'fdm_pla_abs',
      templateId: 'l-bracket',
      wallThicknessMm: 3,
      innerBendRadiusMm: 8,
    })
    expect(f.some((x) => x.code === 'inner-bend-vs-thickness' && x.severity === 'error')).toBe(true)
  })

  it('allows inner bend radius below thickness', () => {
    const f = runBracketChecks({
      processId: 'fdm_pla_abs',
      templateId: 'l-bracket',
      wallThicknessMm: 3,
      innerBendRadiusMm: 1,
    })
    expect(f.some((x) => x.code === 'inner-bend-vs-thickness')).toBe(false)
  })

  it('errors when u-channel wall is not thinner than both flanges', () => {
    const f = runBracketChecks({
      processId: 'fdm_pla_abs',
      templateId: 'u-channel',
      wallThicknessMm: 25,
      leftFlangeHeightMm: 20,
      rightFlangeHeightMm: 20,
    })
    expect(f.some((x) => x.code === 'u-channel-flange-vs-thickness' && x.severity === 'error')).toBe(true)
  })

  it('treats zero wall thickness as error', () => {
    const f = runBracketChecks({
      processId: 'fdm_pla_abs',
      wallThicknessMm: 0,
    })
    expect(f.some((x) => x.code === 'wall-nonpositive')).toBe(true)
    expect(f.some((x) => x.code === 'wall-thin')).toBe(false)
  })
})

describe('computeParamRangeFindings', () => {
  const params: TemplateParameter[] = [
    {
      key: 'xyHoleCompensation',
      label: 'XY hole compensation',
      type: 'number',
      default: 0.1,
      min: 0,
      max: 0.5,
      step: 0.02,
      group: 'fit',
      unit: 'mm',
      advanced: true,
    },
  ]

  it('flags values above max', () => {
    const f = computeParamRangeFindings(params, { xyHoleCompensation: 1 })
    expect(f.some((x) => x.severity === 'error' && x.code === 'range-xyHoleCompensation-max')).toBe(true)
  })
})

describe('computeCustomHoleRangeFinding', () => {
  it('validates custom hole diameter range', () => {
    expect(computeCustomHoleRangeFinding('custom', 1).length).toBeGreaterThan(0)
    expect(computeCustomHoleRangeFinding('M5', 1)).toEqual([])
  })
})
