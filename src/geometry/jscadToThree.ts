import { geometries } from '@jscad/modeling'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import * as THREE from 'three'

/**
 * Turn a JSCAD `geom3` solid into a Three.js mesh-ready geometry.
 * Polygons are triangulated with a simple fan (valid for convex JSCAD polygons).
 */
export function geom3ToBufferGeometry(geom: Geom3): THREE.BufferGeometry {
  const polygons = geometries.geom3.toPolygons(geom)
  const positions: number[] = []
  const indices: number[] = []
  let vertexIndex = 0

  for (const poly of polygons) {
    const verts = poly.vertices
    if (verts.length < 3) continue

    // Fan triangulation from the first vertex (JSCAD polygons are convex).
    const v0 = verts[0]
    for (let i = 1; i < verts.length - 1; i++) {
      const v1 = verts[i]
      const v2 = verts[i + 1]
      positions.push(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2])
      indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2)
      vertexIndex += 3
    }
  }

  const buffer = new THREE.BufferGeometry()
  buffer.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  buffer.setIndex(indices)
  buffer.computeVertexNormals()
  return buffer
}
