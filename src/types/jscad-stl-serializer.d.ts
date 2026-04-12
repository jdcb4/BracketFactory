declare module '@jscad/stl-serializer' {
  import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'

  export function serialize(
    options: { binary?: boolean; text?: boolean },
    ...geometries: Geom3[]
  ): ArrayBuffer[] | string
}
