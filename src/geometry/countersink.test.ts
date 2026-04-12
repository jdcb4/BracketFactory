import { describe, expect, it } from 'vitest'
import { computeCountersinkOuterRadiusAndDepth } from './countersink'

describe('countersink', () => {
  it('caps outer radius at 1.5× hole radius and depth at half thickness', () => {
    const r = 2.5
    const t = 4
    const { outerRadiusMm, depthMm } = computeCountersinkOuterRadiusAndDepth(r, t, 90)
    expect(outerRadiusMm).toBeLessThanOrEqual(1.5 * r + 1e-9)
    expect(depthMm).toBeLessThanOrEqual(t / 2 + 1e-9)
  })

  it('keeps 82° and 90° cones within half-thickness', () => {
    const t = 10
    expect(computeCountersinkOuterRadiusAndDepth(2, t, 82).depthMm).toBeLessThanOrEqual(t / 2)
    expect(computeCountersinkOuterRadiusAndDepth(2, t, 90).depthMm).toBeLessThanOrEqual(t / 2)
  })
})
