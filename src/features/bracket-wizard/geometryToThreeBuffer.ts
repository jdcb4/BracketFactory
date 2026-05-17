import { geometries, modifiers } from "@jscad/modeling";
import * as THREE from "three";

import type { BracketGeometry } from "../../domain/brackets/flatLBracket";

export function geometryToThreeBuffer(geometry: BracketGeometry) {
  const generalize = modifiers.generalize as unknown as (
    options: { snap: boolean; triangulate: boolean },
    geometry: BracketGeometry
  ) => BracketGeometry;
  const triangulated = generalize({ snap: true, triangulate: true }, geometry);
  const polygons = geometries.geom3.toPolygons(triangulated);
  const positions: number[] = [];

  polygons.forEach((polygon) => {
    const points = geometries.poly3.toPoints(polygon);

    for (let index = 1; index < points.length - 1; index += 1) {
      pushPoint(positions, points[0]);
      pushPoint(positions, points[index]);
      pushPoint(positions, points[index + 1]);
    }
  });

  const bufferGeometry = new THREE.BufferGeometry();
  bufferGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  bufferGeometry.computeVertexNormals();
  bufferGeometry.computeBoundingSphere();

  return bufferGeometry;
}

function pushPoint(positions: number[], point: number[]) {
  positions.push(point[0], point[1], point[2]);
}
