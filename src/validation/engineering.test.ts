import { describe, expect, it } from 'vitest'
import {
  BRIDGE_WARN_MM,
  flangeTooShort,
  holeTooCloseToEdge,
  snapWallToNozzleMultiple,
} from './engineering'

describe('engineering', () => {
  it('flags short flange vs thickness', () => {
    expect(flangeTooShort(14, 3)).toBe(false)
    expect(flangeTooShort(10, 3)).toBe(true)
  })

  it('flags hole edge distance', () => {
    expect(holeTooCloseToEdge(4, 2, 1)).toBe(true)
    expect(holeTooCloseToEdge(4, 10, 1)).toBe(false)
  })

  it('snaps wall to nozzle multiple', () => {
    expect(snapWallToNozzleMultiple(0.9, 0.4)).toBeCloseTo(0.8, 5)
  })

  it('bridge constant', () => {
    expect(BRIDGE_WARN_MM).toBe(10)
  })
})
