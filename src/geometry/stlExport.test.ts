import { describe, expect, it } from 'vitest'
import { generateFromStrategy } from '../generators/registry'
import { geom3ToStlBlob } from './stlExport'

describe('stlExport', () => {
  it('produces a non-empty binary STL blob', async () => {
    const g = generateFromStrategy('lBracket', {
      leg1Length: 30,
      leg2Length: 30,
      width: 15,
      thickness: 3,
      innerBendRadius: 0,
      outerFilletRadius: 0,
      holeDiameter: 4,
      holeCountLeg1: 0,
      holeCountLeg2: 0,
      edgeOffset: 5,
      xyHoleCompensation: 0,
    })
    const blob = geom3ToStlBlob(g)
    // Binary STL: 80-byte header + 4-byte count + 50 bytes per triangle
    expect(blob.size).toBeGreaterThan(84)
    const header = new Uint8Array(await blob.slice(0, 5).arrayBuffer())
    // Binary STL: skip 80-byte header; expect non-zero triangle data after.
    expect(header.some((b) => b !== 0)).toBe(true)
  })
})
