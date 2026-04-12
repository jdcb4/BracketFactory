import { describe, expect, it } from 'vitest'
import { gussetCenterYsBetweenHoleRows, maxHoleRowsAlongWidth, minHoleRowPitchMm } from './holeLayout'

describe('holeLayout', () => {
  it('computes a sane max row count from width and hole pitch', () => {
    // 20 mm wide, 5 mm holes, 2 mm edge offset, 2 mm min edge: margin ~4.5, usable ~11, pitch 9
    expect(maxHoleRowsAlongWidth(20, 5, 2, 2)).toBe(2)
    expect(minHoleRowPitchMm(5, 2)).toBe(9)
  })

  it('places gussets in end gaps when one hole row is centered (between rows / ends)', () => {
    const W = 24
    const ys = [W / 2]
    const centers = gussetCenterYsBetweenHoleRows(W, 2, 2, ys, 2.65, 2)
    expect(centers.length).toBeGreaterThanOrEqual(1)
    for (const c of centers) {
      expect(Math.abs(c - ys[0])).toBeGreaterThan(2.65 + 1 + 1)
    }
  })
})
