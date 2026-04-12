import { serialize } from '@jscad/stl-serializer'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'

/** Binary STL from the same `geom3` used for preview. */
export function geom3ToStlBlob(geom: Geom3): Blob {
  const raw = serialize({ binary: true }, geom) as ArrayBuffer[]
  // Serializer returns multiple chunks (header, triangle count, payload); include all.
  return new Blob(raw as BlobPart[], { type: 'application/sla' })
}
