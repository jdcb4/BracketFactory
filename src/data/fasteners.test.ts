import { describe, expect, it } from 'vitest'
import { imperialShankDiameterMm, inchesToMm } from './fasteners'

describe('fasteners', () => {
  it('converts inches to mm', () => {
    expect(inchesToMm(1)).toBeCloseTo(25.4, 5)
  })

  it('resolves #6 shank to mm', () => {
    const mm = imperialShankDiameterMm('#6')
    expect(mm).toBeCloseTo(0.138 * 25.4, 3)
  })
})
