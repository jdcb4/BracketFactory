declare module "@jscad/stl-serializer" {
  export function serialize(
    options: { binary?: boolean },
    ...objects: unknown[]
  ): Array<string | ArrayBuffer | ArrayBufferView>;
}

declare module "@jscad/3mf-serializer" {
  export function serialize(
    options: { unit?: "millimeter"; metadata?: boolean; compress?: boolean },
    ...objects: unknown[]
  ): Array<string | ArrayBuffer | ArrayBufferView>;
}
