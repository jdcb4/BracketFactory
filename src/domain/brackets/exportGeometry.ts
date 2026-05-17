import { serialize as serialize3mf } from "@jscad/3mf-serializer";
import { serialize as serializeStl } from "@jscad/stl-serializer";

import type { BracketGeometry } from "./flatLBracket";

export type ExportFormat = "stl" | "3mf";

export function geometryToBlob(geometry: BracketGeometry, format: ExportFormat) {
  const raw =
    format === "stl"
      ? serializeStl({ binary: true }, geometry)
      : serialize3mf({ unit: "millimeter", metadata: true, compress: true }, geometry);

  return new Blob(toBlobParts(raw), {
    type: format === "stl" ? "model/stl" : "model/3mf"
  });
}

export function downloadGeometry(geometry: BracketGeometry, format: ExportFormat, baseName: string) {
  const blob = geometryToBlob(geometry, format);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${baseName}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toBlobParts(parts: Array<string | ArrayBuffer | ArrayBufferView>): BlobPart[] {
  return parts.map((part) => {
    if (typeof part === "string" || part instanceof ArrayBuffer) {
      return part;
    }

    return new Uint8Array(part.buffer, part.byteOffset, part.byteLength).slice().buffer;
  });
}
