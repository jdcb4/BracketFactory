import {
  booleans,
  colors,
  measurements,
  primitives,
  transforms,
} from "@jscad/modeling";
import { z } from "zod";

import {
  getHardware,
  hardwareOptions,
  type BracketGeometry,
  type HardwareId,
} from "./flatLBracket";
import { clampInteger, clampNumber, roundUp } from "./constraintMath";

const hardwareIds = hardwareOptions.map((option) => option.id) as [
  HardwareId,
  ...HardwareId[],
];
const minBaseLength = 10;
const maxBaseLength = 180;
const minUprightHeight = 10;
const maxUprightHeight = 160;
const minLegWidth = 26;
const maxLegWidth = 300;
const minThickness = 4;
const maxThickness = 12;
const minHolesPerFace = 0;
const maxHolesPerFace = 6;
const minRows = 1;
const maxRowsPerFace = 6;
const minGussetSizePercent = 25;
const maxGussetSizePercent = 100;
const gussetThickness = 4;
const gussetLayoutIds = [
  "none",
  "center",
  "singleQuarter",
  "quarterPair",
] as const;

export type AngleGussetLayout = (typeof gussetLayoutIds)[number];

export type AngleGussetOption = {
  id: AngleGussetLayout;
  label: string;
  description: string;
  ribCount: number;
  centers: number[];
  available: boolean;
  blockedReason?: string;
};

export const angleBracketSchema = z.object({
  baseLength: z.number().min(minBaseLength).max(maxBaseLength),
  uprightHeight: z.number().min(minUprightHeight).max(maxUprightHeight),
  legWidth: z.number().min(minLegWidth).max(maxLegWidth),
  thickness: z.number().min(minThickness).max(maxThickness),
  hardware: z.enum(hardwareIds),
  holeStyle: z.enum(["through", "countersunk"]),
  baseHoles: z.number().int().min(minHolesPerFace).max(maxHolesPerFace),
  uprightHoles: z.number().int().min(minHolesPerFace).max(maxHolesPerFace),
  rows: z.number().int().min(minRows).max(maxRowsPerFace),
  gussetLayout: z.enum(gussetLayoutIds),
  gussetSizePercent: z
    .number()
    .int()
    .min(minGussetSizePercent)
    .max(maxGussetSizePercent),
});

export type AngleBracketParams = z.infer<typeof angleBracketSchema>;

export type AngleHoleCenter = {
  face: "base" | "upright";
  x: number;
  y: number;
  z: number;
};

export type AngleBracketConstraints = {
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
  holeCenters: AngleHoleCenter[];
  warnings: string[];
  valid: boolean;
};

export const defaultAngleBracketParams: AngleBracketParams = {
  baseLength: 82,
  uprightHeight: 72,
  legWidth: 80,
  thickness: 5,
  hardware: "m4",
  holeStyle: "through",
  baseHoles: 2,
  uprightHoles: 2,
  rows: 1,
  gussetLayout: "none",
  gussetSizePercent: 45,
};

export function deriveAngleBracketConstraints(
  params: AngleBracketParams,
): AngleBracketConstraints {
  const hardware = getHardware(params.hardware);
  const countersinkDepth = roundUp(
    (hardware.headDiameter - hardware.holeDiameter) / 2 + 0.2,
    0.1,
  );
  const countersinkAvailable = params.thickness >= countersinkDepth + 1.2;
  const protectedDiameter =
    params.holeStyle === "countersunk" && countersinkAvailable
      ? hardware.headDiameter
      : hardware.holeDiameter;
  const edgeClearance = roundUp(
    Math.max(7, protectedDiameter * 0.9, hardware.holeDiameter * 1.8),
    0.5,
  );
  const minPitch = roundUp(
    Math.max(14, protectedDiameter + 5, hardware.holeDiameter * 3),
    0.5,
  );
  const maxRows = countRowsAcrossWidth(
    params.legWidth,
    edgeClearance,
    minPitch,
  );
  const maxBaseHoles = Math.min(
    maxHolesPerFace,
    countAlongFace(
      params.baseLength,
      params.thickness,
      edgeClearance,
      minPitch,
    ),
  );
  const maxUprightHoles = Math.min(
    maxHolesPerFace,
    countAlongFace(
      params.uprightHeight,
      params.thickness,
      edgeClearance,
      minPitch,
    ),
  );
  const safeRows = Math.min(params.rows, maxRows);
  const rowPositions = rowPositionsForWidth(
    params.legWidth,
    edgeClearance,
    safeRows,
  );
  const gussetOptions = deriveGussetOptions(
    params.legWidth,
    edgeClearance,
    rowPositions,
    protectedDiameter,
  );
  const selectedGussetOption =
    gussetOptions.find((option) => option.id === params.gussetLayout) ??
    gussetOptions[0];
  const warnings: string[] = [];

  if (params.rows > maxRows) {
    warnings.push(
      "The bracket width cannot fit that many safe rows for this hardware.",
    );
  }

  if (params.baseHoles > maxBaseHoles) {
    warnings.push(
      "The base flange is too short for that many holes at the safe pitch.",
    );
  }

  if (params.uprightHoles > maxUprightHoles) {
    warnings.push(
      "The upright flange is too short for that many holes at the safe pitch.",
    );
  }

  if (!selectedGussetOption.available) {
    warnings.push(
      selectedGussetOption.blockedReason ??
        "The selected gusset layout conflicts with the current hole rows.",
    );
  }

  if (params.holeStyle === "countersunk" && !countersinkAvailable) {
    warnings.push(
      "The plate is too thin for a robust countersink with this hardware.",
    );
  }

  const holeCenters = [
    ...centersForFace(
      "base",
      params.baseLength,
      params.legWidth,
      params.thickness,
      edgeClearance,
      params.baseHoles,
      safeRows,
    ),
    ...centersForFace(
      "upright",
      params.uprightHeight,
      params.legWidth,
      params.thickness,
      edgeClearance,
      params.uprightHoles,
      safeRows,
    ),
  ];

  return {
    holeDiameter: hardware.holeDiameter,
    headDiameter: hardware.headDiameter,
    countersinkDepth,
    countersinkAvailable,
    edgeClearance,
    minPitch,
    maxRows,
    maxBaseHoles,
    maxUprightHoles,
    gussetOptions,
    selectedGussetOption,
    holeCenters,
    warnings,
    valid: warnings.length === 0,
  };
}

export function normalizeAngleBracketParams(
  params: AngleBracketParams,
): AngleBracketParams {
  const parsed = angleBracketSchema.parse(sanitizeAngleBracketParams(params));
  const constraints = deriveAngleBracketConstraints(parsed);

  return {
    ...parsed,
    holeStyle:
      parsed.holeStyle === "countersunk" && !constraints.countersinkAvailable
        ? "through"
        : parsed.holeStyle,
    rows: Math.min(parsed.rows, constraints.maxRows),
    baseHoles: Math.min(parsed.baseHoles, constraints.maxBaseHoles),
    uprightHoles: Math.min(parsed.uprightHoles, constraints.maxUprightHoles),
    gussetLayout: constraints.selectedGussetOption.available
      ? parsed.gussetLayout
      : "none",
    gussetSizePercent: parsed.gussetSizePercent,
  };
}

export function buildAngleBracketGeometry(
  params: AngleBracketParams,
): BracketGeometry {
  const safeParams = normalizeAngleBracketParams(params);
  const constraints = deriveAngleBracketConstraints(safeParams);
  const base = primitives.cuboid({
    center: [
      safeParams.baseLength / 2,
      safeParams.legWidth / 2,
      safeParams.thickness / 2,
    ],
    size: [safeParams.baseLength, safeParams.legWidth, safeParams.thickness],
  });
  const upright = primitives.cuboid({
    center: [
      safeParams.thickness / 2,
      safeParams.legWidth / 2,
      safeParams.uprightHeight / 2,
    ],
    size: [safeParams.thickness, safeParams.legWidth, safeParams.uprightHeight],
  });
  const gussets = gussetCenters(
    safeParams.legWidth,
    safeParams.gussetLayout,
  ).map((center) =>
    buildGusset(
      center,
      safeParams.baseLength * (safeParams.gussetSizePercent / 100),
      safeParams.uprightHeight * (safeParams.gussetSizePercent / 100),
      safeParams.thickness,
    ),
  );
  const bracketBody = booleans.union(base, upright, ...gussets);
  const throughCutters = constraints.holeCenters.map((center) =>
    center.face === "base"
      ? primitives.cylinder({
          center: [center.x, center.y, safeParams.thickness / 2],
          height: safeParams.thickness + 3,
          radius: constraints.holeDiameter / 2,
          segments: 48,
        })
      : transforms.translate(
          [safeParams.thickness / 2, center.y, center.z],
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
                  safeParams.thickness -
                    constraints.countersinkDepth / 2 +
                    0.1,
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

export function summarizeAngleBracket(params: AngleBracketParams) {
  const constraints = deriveAngleBracketConstraints(
    normalizeAngleBracketParams(params),
  );
  const geometry = buildAngleBracketGeometry(params);
  const dimensions = measurements.measureDimensions(geometry);
  const volume = measurements.measureVolume(geometry);

  return {
    dimensions,
    volume,
    constraints,
  };
}

function sanitizeAngleBracketParams(
  params: AngleBracketParams,
): AngleBracketParams {
  return {
    baseLength: clampNumber(
      params.baseLength,
      minBaseLength,
      maxBaseLength,
      defaultAngleBracketParams.baseLength,
    ),
    uprightHeight: clampNumber(
      params.uprightHeight,
      minUprightHeight,
      maxUprightHeight,
      defaultAngleBracketParams.uprightHeight,
    ),
    legWidth: clampNumber(
      params.legWidth,
      minLegWidth,
      maxLegWidth,
      defaultAngleBracketParams.legWidth,
    ),
    thickness: clampNumber(
      params.thickness,
      minThickness,
      maxThickness,
      defaultAngleBracketParams.thickness,
    ),
    hardware: hardwareIds.includes(params.hardware)
      ? params.hardware
      : defaultAngleBracketParams.hardware,
    holeStyle:
      params.holeStyle === "through" || params.holeStyle === "countersunk"
        ? params.holeStyle
        : defaultAngleBracketParams.holeStyle,
    baseHoles: clampInteger(
      params.baseHoles,
      minHolesPerFace,
      maxHolesPerFace,
      defaultAngleBracketParams.baseHoles,
    ),
    uprightHoles: clampInteger(
      params.uprightHoles,
      minHolesPerFace,
      maxHolesPerFace,
      defaultAngleBracketParams.uprightHoles,
    ),
    rows: clampInteger(
      params.rows,
      minRows,
      maxRowsPerFace,
      defaultAngleBracketParams.rows,
    ),
    gussetLayout: gussetLayoutIds.includes(params.gussetLayout)
      ? params.gussetLayout
      : defaultAngleBracketParams.gussetLayout,
    gussetSizePercent: clampInteger(
      params.gussetSizePercent,
      minGussetSizePercent,
      maxGussetSizePercent,
      defaultAngleBracketParams.gussetSizePercent,
    ),
  };
}

function countAlongFace(
  length: number,
  cornerThickness: number,
  edgeClearance: number,
  minPitch: number,
) {
  const span = length - cornerThickness - edgeClearance * 2;

  if (span < 0) {
    return 0;
  }

  return Math.max(0, Math.floor(span / minPitch) + 1);
}

function countRowsAcrossWidth(
  legWidth: number,
  edgeClearance: number,
  minPitch: number,
) {
  const span = legWidth - edgeClearance * 2;

  if (span < minPitch) {
    return minRows;
  }

  return Math.min(maxRowsPerFace, Math.floor(span / minPitch) + 1);
}

function centersForFace(
  face: "base" | "upright",
  length: number,
  legWidth: number,
  thickness: number,
  edgeClearance: number,
  holeCount: number,
  rows: number,
): AngleHoleCenter[] {
  if (holeCount <= 0) {
    return [];
  }

  const count = holeCount;
  const start = thickness + edgeClearance;
  const end = length - edgeClearance;
  const along =
    count === 1
      ? [(start + end) / 2]
      : Array.from(
          { length: count },
          (_, index) => start + ((end - start) * index) / (count - 1),
        );
  const across = rowPositionsForWidth(legWidth, edgeClearance, rows);

  return along.flatMap((primary) =>
    across.map((secondary) =>
      face === "base"
        ? { face, x: primary, y: secondary, z: thickness / 2 }
        : { face, x: thickness / 2, y: secondary, z: primary },
    ),
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

function deriveGussetOptions(
  legWidth: number,
  edgeClearance: number,
  rowPositions: number[],
  protectedDiameter: number,
): AngleGussetOption[] {
  const blockedSpacing = Math.max(
    protectedDiameter / 2 + gussetThickness / 2 + 2,
    edgeClearance * 0.75,
  );
  const options = [
    {
      id: "none",
      label: "No ribs",
      description: "Keep the inside corner clear.",
      centers: [],
    },
    {
      id: "center",
      label: "Center rib",
      description: "One rib on the centerline, useful between two hole rows.",
      centers: [legWidth / 2],
    },
    {
      id: "singleQuarter",
      label: "Single 25% rib",
      description: "One offset rib at 25% width when the center is occupied.",
      centers: [legWidth * 0.25],
    },
    {
      id: "quarterPair",
      label: "25% / 75% pair",
      description: "Balanced support ribs at quarter-width positions.",
      centers: [legWidth * 0.25, legWidth * 0.75],
    },
  ] as const;

  return options.map((option) => {
    const ribCount = option.centers.length;
    const edgeBlocked = option.centers.some(
      (center) =>
        center < edgeClearance + gussetThickness / 2 ||
        center > legWidth - edgeClearance - gussetThickness / 2,
    );
    const rowBlocked = option.centers.some((center) =>
      rowPositions.some(
        (rowPosition) => Math.abs(center - rowPosition) < blockedSpacing,
      ),
    );
    const available = option.id === "none" || (!edgeBlocked && !rowBlocked);

    return {
      ...option,
      centers: [...option.centers],
      ribCount,
      available,
      blockedReason: edgeBlocked
        ? "This bracket is too narrow for that rib layout."
        : rowBlocked
          ? "That rib layout crosses a protected hole row."
          : undefined,
    };
  });
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

function buildGusset(
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
