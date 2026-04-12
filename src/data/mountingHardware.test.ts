import { describe, expect, it } from 'vitest'
import { countersinkIncludedAngleDegForBolt, resolveClearanceHoleDiameterMm } from './mountingHardware'

describe('mountingHardware', () => {
  it('uses custom diameter when preset is custom', () => {
    expect(resolveClearanceHoleDiameterMm('custom', 4.2)).toBe(4.2)
  })

  it('uses clearance table for metric bolts', () => {
    expect(resolveClearanceHoleDiameterMm('M8', 4)).toBe(8.4)
  })

  it('maps bolt family to countersink included angle', () => {
    expect(countersinkIncludedAngleDegForBolt('M5')).toBe(90)
    expect(countersinkIncludedAngleDegForBolt('UNC_8_32')).toBe(82)
    expect(countersinkIncludedAngleDegForBolt('custom')).toBe(90)
  })
})
