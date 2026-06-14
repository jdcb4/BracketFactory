import {
  booleans,
  colors,
  measurements,
  primitives,
  transforms,
} from "@jscad/modeling";

import {
  angleBracketSchema,
  defaultAngleBracketParams,
  deriveAngleBracketConstraints,
  normalizeAngleBracketParams,
  type AngleBracketParams,
  type AngleGussetLayout,
  type AngleGussetOption,
} from "./angleBracket";
import { type BracketGeometry } from "./flatLBracket";

const maxHolesPerFace = 6;
const gussetThickness = 4;

export const uBracketSchema = angleBracketSchema;

export type UBracketParams = AngleBracketParams;

export type UHoleCenter = {
  face: "base" | "leftUpright" | "rightUpright";
  x: number;
  y: number;
  z: number;
};

export type UBracketConstraints = {
  holeDiameter: number;
  headDiameter: number;
  countersinkDepth: number;
  countersinkAvailable: boolean;
  edgeClearance: number;
  minPitch: number;
  maxRows: number;
  maxBaseHoles: number;
  maxUprightHoles: number;
  gussetOptions: AngleGussetOption[];
  selectedGussetOption: AngleGussetOption;
  holeCenters: UHoleCenter[];
  warnings: string[];
  valid: boolean;
};

export const defaultUBracketParams: UBracketParams = {
  ...defaultAngleBracketParams,
  baseLength: 96,
  uprightHeight: 64,
  legWidth: 80,
  baseHoles: 2,
  uprightHoles: 2,
  gussetLayout: "none",
};

export function deriveUBracketConstraints(
  params: UBracketParams,
): UBracketConstraints {
  const angleConstraints = deriveAngleBracketConstraints(params);
  const maxBaseHoles = Math.min(
    maxHolesPerFace,
    countAlongUBase(
      params.baseLength,
      params.thickness,
      angleConstraints.edgeClearance,
      angleConstraints.minPitch,
    ),
  );
  const warnings: string[] = [];

  if (params.rows > angleConstraints.maxRows) {
    warnings.push(
      "The bracket width cannot fit that many safe rows for this hardware.",
    );
  }

  if (params.baseHoles > maxBaseHoles) {
    warnings.push(
      "The base flange is too short for that many holes between the upright flanges.",
    );
  }

  if (params.uprightHoles > angleConstraints.maxUprightHoles) {
    warnings.push(
      "The upright flanges are too short for that many holes at the safe pitch.",
    );
  }

  if (!angleConstraints.selectedGussetOption.available) {
    warnings.push(
      angleConstraints.selectedGussetOption.blockedReason ??
        "The selected gusset layout conflicts with the current hole rows.",
    );
  }

  if (
    params.holeStyle === "countersunk" &&
    !angleConstraints.countersinkAvailable
  ) {
    warnings.push(
      "The plate is too thin for a robust countersink with this hardware.",
    );
  }

  const safeRows = Math.min(params.rows, angleConstraints.maxRows);
  const holeCenters = [
    ...centersForBase(
      params.baseLength,
      params.legWidth,
      params.thickness,
      angleConstraints.edgeClearance,
      params.baseHoles,
      safeRows,
    ),
    ...centersForUpright(
      "leftUpright",
      params.baseLength,
      params.uprightHeight,
      params.legWidth,
      params.thickness,
      angleConstraints.edgeClearance,
      params.uprightHoles,
      safeRows,
    ),
    ...centersForUpright(
      "rightUpright",
      params.baseLength,
      params.uprightHeight,
      params.legWidth,
      params.thickness,
      angleConstraints.edgeClearance,
      params.uprightHoles,
      safeRows,
    ),
  ];

  return {
    holeDiameter: angleConstraints.holeDiameter,
    headDiameter: angleConstraints.headDiameter,
    countersinkDepth: angleConstraints.countersinkDepth,
    countersinkAvailable: angleConstraints.countersinkAvailable,
    edgeClearance: angleConstraints.edgeClearance,
    minPitch: angleConstraints.minPitch,
    maxRows: angleConstraints.maxRows,
    maxBaseHoles,
    maxUprightHoles: angleConstraints.maxUprightHoles,
    gussetOptions: angleConstraints.gussetOptions,
    selectedGussetOption: angleConstraints.selectedGussetOption,
    holeCenters,
    warnings,
    valid: warnings.length === 0,
  };
}

export function normalizeUBracketParams(
  params: UBracketParams,
): UBracketParams {
  const parsed = normalizeAngleBracketParams(params);
  const constraints = deriveUBracketConstraints(parsed);

  return {
    ...parsed,
    baseHoles: Math.min(parsed.baseHoles, constraints.maxBaseHoles),
    uprightHoles: Math.min(parsed.uprightHoles, constraints.maxUprightHoles),
    gussetLayout: constraints.selectedGussetOption.available
      ? parsed.gussetLayout
      : "none",
  };
}

export function buildUBracketGeometry(params: UBracketParams): BracketGeometry {
  const safeParams = normalizeUBracketParams(params);
  const constraints = deriveUBracketConstraints(safeParams);
  const base = primitives.cuboid({
    center: [
      safeParams.baseLength / 2,
      safeParams.legWidth / 2,
      safeParams.thickness / 2,
    ],
    size: [safeParams.baseLength, safeParams.legWidth, safeParams.thickness],
  });
  const leftUpright = primitives.cuboid({
    center: [
      safeParams.thickness / 2,
      safeParams.legWidth / 2,
      safeParams.uprightHeight / 2,
    ],
    size: [safeParams.thickness, safeParams.legWidth, safeParams.uprightHeight],
  });
  const rightUpright = primitives.cuboid({
    center: [
      safeParams.baseLength - safeParams.thickness / 2,
      safeParams.legWidth / 2,
      safeParams.uprightHeight / 2,
    ],
    size: [safeParams.thickness, safeParams.legWidth, safeParams.uprightHeight],
  });
  const gussets = gussetCenters(
    safeParams.legWidth,
    safeParams.gussetLayout,
  ).flatMap((center) => [
    buildLeftGusset(
      center,
      gussetReach(safeParams.baseLength, safeParams.gussetSizePercent),
      safeParams.uprightHeight * (safeParams.gussetSizePercent / 100),
      safeParams.thickness,
    ),
    buildRightGusset(
      center,
      safeParams.baseLength,
      gussetReach(safeParams.baseLength, safeParams.gussetSizePercent),
      safeParams.uprightHeight * (safeParams.gussetSizePercent / 100),
      safeParams.thickness,
    ),
  ]);
  const bracketBody = booleans.union(
    base,
    leftUpright,
    rightUpright,
    ...gussets,
  );
  const throughCutters = constraints.holeCenters.map((center) =>
    center.face === "base"
      ? primitives.cylinder({
          center: [center.x, center.y, safeParams.thickness / 2],
          height: safeParams.thickness + 3,
          radius: constraints.holeDiameter / 2,
          segments: 48,
        })
      : transforms.translate(
          [center.x, center.y, center.z],
          transforms.rotateY(
            Math.PI / 2,
            primitives.cylinder({
              height: safeParams.thickness + 3,
              radius: constraints.holeDiameter / 2,
              segments: 48,
            }),
          ),
        ),
  );
  const countersinkCutters =
    safeParams.holeStyle === "countersunk"
      ? constraints.holeCenters.map((center) =>
          center.face === "base"
            ? primitives.cylinderElliptic({
                center: [
                  center.x,
                  center.y,
                  safeParams.thickness - constraints.countersinkDepth / 2 + 0.1,
                ],
                height: constraints.countersinkDepth + 0.2,
                startRadius: [
                  constraints.holeDiameter / 2,
                  constraints.holeDiameter / 2,
                ],
                endRadius: [
                  constraints.headDiameter / 2,
                  constraints.headDiameter / 2,
                ],
                segments: 64,
              })
            : transforms.translate(
                [
                  countersinkX(
                    center.face,
                    safeParams,
                    constraints.countersinkDepth,
                  ),
                  center.y,
                  center.z,
                ],
                transforms.rotateY(
                  Math.PI / 2,
                  primitives.cylinderElliptic({
                    height: constraints.countersinkDepth + 0.2,
                    startRadius: [
                      constraints.holeDiameter / 2,
                      constraints.holeDiameter / 2,
                    ],
                    endRadius: [
                      constraints.headDiameter / 2,
                      constraints.headDiameter / 2,
                    ],
                    segments: 64,
                  }),
                ),
              ),
        )
      : [];
  const allCutters = [...throughCutters, ...countersinkCutters];
  const bracket =
    allCutters.length > 0
      ? booleans.subtract(bracketBody, ...allCutters)
      : bracketBody;

  return colors.colorize([0.78, 0.68, 0.46, 1], bracket);
}

export function summarizeUBracket(params: UBracketParams) {
  const constraints = deriveUBracketConstraints(
    normalizeUBracketParams(params),
  );
  const geometry = buildUBracketGeometry(params);
  const dimensions = measurements.measureDimensions(geometry);
  const volume = measurements.measureVolume(geometry);

  return {
    dimensions,
    volume,
    constraints,
  };
}

function countAlongUBase(
  length: number,
  thickness: number,
  edgeClearance: number,
  minPitch: number,
) {
  const span = length - thickness * 2 - edgeClearance * 2;

  if (span < 0) {
    return 0;
  }

  return Math.max(0, Math.floor(span / minPitch) + 1);
}

function centersForBase(
  baseLength: number,
  legWidth: number,
  thickness: number,
  edgeClearance: number,
  holeCount: number,
  rows: number,
): UHoleCenter[] {
  if (holeCount <= 0) {
    return [];
  }

  const start = thickness + edgeClearance;
  const end = baseLength - thickness - edgeClearance;
  const along = positionsBetween(start, end, holeCount);
  const across = rowPositionsForWidth(legWidth, edgeClearance, rows);

  return along.flatMap((x) =>
    across.map((y) => ({
      face: "base" as const,
      x,
      y,
      z: thickness / 2,
    })),
  );
}

function centersForUpright(
  face: "leftUpright" | "rightUpright",
  baseLength: number,
  uprightHeight: number,
  legWidth: number,
  thickness: number,
  edgeClearance: number,
  holeCount: number,
  rows: number,
): UHoleCenter[] {
  if (holeCount <= 0) {
    return [];
  }

  const start = thickness + edgeClearance;
  const end = uprightHeight - edgeClearance;
  const along = positionsBetween(start, end, holeCount);
  const across = rowPositionsForWidth(legWidth, edgeClearance, rows);

  return along.flatMap((z) =>
    across.map((y) => ({
      face,
      x: face === "leftUpright" ? thickness / 2 : baseLength - thickness / 2,
      y,
      z,
    })),
  );
}

function positionsBetween(start: number, end: number, count: number) {
  return count === 1
    ? [(start + end) / 2]
    : Array.from(
        { length: count },
        (_, index) => start + ((end - start) * index) / (count - 1),
      );
}

function rowPositionsForWidth(
  legWidth: number,
  edgeClearance: number,
  rows: number,
) {
  return rows === 1
    ? [legWidth / 2]
    : Array.from(
        { length: rows },
        (_, index) =>
          edgeClearance + ((legWidth - edgeClearance * 2) * index) / (rows - 1),
      );
}

function countersinkX(
  face: "leftUpright" | "rightUpright",
  params: UBracketParams,
  countersinkDepth: number,
) {
  return face === "leftUpright"
    ? params.thickness - countersinkDepth / 2 + 0.1
    : params.baseLength - params.thickness + countersinkDepth / 2 - 0.1;
}

function gussetReach(baseLength: number, gussetSizePercent: number) {
  return Math.min(baseLength / 2, baseLength * (gussetSizePercent / 100));
}

function gussetCenters(legWidth: number, layout: AngleGussetLayout) {
  if (layout === "center") {
    return [legWidth / 2];
  }

  if (layout === "singleQuarter") {
    return [legWidth * 0.25];
  }

  if (layout === "quarterPair") {
    return [legWidth * 0.25, legWidth * 0.75];
  }

  return [];
}

function buildLeftGusset(
  yCenter: number,
  reach: number,
  height: number,
  thickness: number,
): BracketGeometry {
  const yMin = yCenter - gussetThickness / 2;
  const yMax = yCenter + gussetThickness / 2;

  return primitives.polyhedron({
    points: [
      [thickness, yMin, thickness],
      [reach, yMin, thickness],
      [thickness, yMin, height],
      [thickness, yMax, thickness],
      [reach, yMax, thickness],
      [thickness, yMax, height],
    ],
    faces: [
      [0, 2, 1],
      [3, 4, 5],
      [0, 1, 4, 3],
      [0, 3, 5, 2],
      [1, 2, 5, 4],
    ],
    orientation: "inward",
  });
}

function buildRightGusset(
  yCenter: number,
  baseLength: number,
  reach: number,
  height: number,
  thickness: number,
): BracketGeometry {
  const yMin = yCenter - gussetThickness / 2;
  const yMax = yCenter + gussetThickness / 2;

  return primitives.polyhedron({
    points: [
      [baseLength - thickness, yMin, thickness],
      [baseLength - reach, yMin, thickness],
      [baseLength - thickness, yMin, height],
      [baseLength - thickness, yMax, thickness],
      [baseLength - reach, yMax, thickness],
      [baseLength - thickness, yMax, height],
    ],
    faces: [
      [0, 1, 2],
      [3, 5, 4],
      [0, 3, 4, 1],
      [0, 2, 5, 3],
      [1, 4, 5, 2],
    ],
    orientation: "inward",
  });
}
