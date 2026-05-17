import {
  booleans,
  colors,
  geometries,
  measurements,
  primitives,
} from "@jscad/modeling";
import { z } from "zod";

import { clampInteger, clampNumber, roundUp } from "./constraintMath";

export type BracketGeometry = geometries.geom3.Geom3;

const hardwareIds = [
  "m2_5",
  "m3",
  "m4",
  "m5",
  "m6",
  "no6",
  "no8",
  "no10",
] as const;
const minXLength = 50;
const maxXLength = 180;
const minYLength = 50;
const maxYLength = 180;
const minLegWidth = 22;
const maxLegWidth = 60;
const minThickness = 3;
const maxThickness = 12;
const minHolesPerLeg = 1;
const maxHolesPerLeg = 6;
const minRows = 1;
const maxRowsPerLeg = 2;

export const hardwareOptions = [
  { id: "m2_5", label: "M2.5", holeDiameter: 2.9, headDiameter: 5.0 },
  { id: "m3", label: "M3", holeDiameter: 3.4, headDiameter: 6.0 },
  { id: "m4", label: "M4", holeDiameter: 4.5, headDiameter: 8.0 },
  { id: "m5", label: "M5", holeDiameter: 5.5, headDiameter: 10.0 },
  { id: "m6", label: "M6", holeDiameter: 6.6, headDiameter: 12.0 },
  { id: "no6", label: "#6 screw", holeDiameter: 4.0, headDiameter: 7.5 },
  { id: "no8", label: "#8 screw", holeDiameter: 4.5, headDiameter: 8.6 },
  { id: "no10", label: "#10 screw", holeDiameter: 5.0, headDiameter: 9.8 },
] as const;

export type HardwareId = (typeof hardwareOptions)[number]["id"];
export type HoleStyle = "through" | "countersunk";

export const flatLBracketSchema = z.object({
  xLength: z.number().min(minXLength).max(maxXLength),
  yLength: z.number().min(minYLength).max(maxYLength),
  legWidth: z.number().min(minLegWidth).max(maxLegWidth),
  thickness: z.number().min(minThickness).max(maxThickness),
  hardware: z.enum(hardwareIds),
  holeStyle: z.enum(["through", "countersunk"]),
  xHoles: z.number().int().min(minHolesPerLeg).max(maxHolesPerLeg),
  yHoles: z.number().int().min(minHolesPerLeg).max(maxHolesPerLeg),
  rows: z.number().int().min(minRows).max(maxRowsPerLeg),
});

export type FlatLBracketParams = z.infer<typeof flatLBracketSchema>;

export type HoleCenter = {
  x: number;
  y: number;
  leg: "x" | "y";
};

export type FlatLBracketConstraints = {
  holeDiameter: number;
  headDiameter: number;
  countersinkDepth: number;
  countersinkAvailable: boolean;
  edgeClearance: number;
  minPitch: number;
  maxRows: number;
  maxXHoles: number;
  maxYHoles: number;
  holeCenters: HoleCenter[];
  warnings: string[];
  valid: boolean;
};

export const defaultFlatLBracketParams: FlatLBracketParams = {
  xLength: 96,
  yLength: 76,
  legWidth: 32,
  thickness: 5,
  hardware: "m4",
  holeStyle: "through",
  xHoles: 3,
  yHoles: 2,
  rows: 1,
};

export function getHardware(id: HardwareId) {
  return (
    hardwareOptions.find((option) => option.id === id) ?? hardwareOptions[1]
  );
}

export function deriveFlatLBracketConstraints(
  params: FlatLBracketParams,
): FlatLBracketConstraints {
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
    Math.max(6, protectedDiameter * 0.85, hardware.holeDiameter * 1.75),
    0.5,
  );
  const minPitch = roundUp(
    Math.max(12, protectedDiameter + 4, hardware.holeDiameter * 2.8),
    0.5,
  );
  const maxRows =
    params.legWidth >= edgeClearance * 2 + minPitch ? maxRowsPerLeg : minRows;
  const maxXHoles = Math.min(
    maxHolesPerLeg,
    countAlongLeg(params.xLength, params.legWidth, edgeClearance, minPitch),
  );
  const maxYHoles = Math.min(
    maxHolesPerLeg,
    countAlongLeg(params.yLength, params.legWidth, edgeClearance, minPitch),
  );
  const warnings: string[] = [];

  if (params.rows > maxRows) {
    warnings.push(
      "The selected leg width cannot fit two safe rows for this hardware.",
    );
  }

  if (params.xHoles > maxXHoles) {
    warnings.push(
      "The horizontal leg is too short for that many holes at the safe pitch.",
    );
  }

  if (params.yHoles > maxYHoles) {
    warnings.push(
      "The vertical leg is too short for that many holes at the safe pitch.",
    );
  }

  if (params.holeStyle === "countersunk" && !countersinkAvailable) {
    warnings.push(
      "The plate is too thin for a robust countersink with this hardware.",
    );
  }

  const safeRows = Math.min(params.rows, maxRows);
  const holeCenters = [
    ...centersForLeg(
      "x",
      params.xLength,
      params.legWidth,
      edgeClearance,
      params.xHoles,
      safeRows,
    ),
    ...centersForLeg(
      "y",
      params.yLength,
      params.legWidth,
      edgeClearance,
      params.yHoles,
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
    maxXHoles,
    maxYHoles,
    holeCenters,
    warnings,
    valid: warnings.length === 0,
  };
}

export function normalizeFlatLBracketParams(
  params: FlatLBracketParams,
): FlatLBracketParams {
  const parsed = flatLBracketSchema.parse(sanitizeFlatLBracketParams(params));
  const constraints = deriveFlatLBracketConstraints(parsed);

  return {
    ...parsed,
    holeStyle:
      parsed.holeStyle === "countersunk" && !constraints.countersinkAvailable
        ? "through"
        : parsed.holeStyle,
    rows: Math.min(parsed.rows, constraints.maxRows),
    xHoles: Math.min(parsed.xHoles, constraints.maxXHoles),
    yHoles: Math.min(parsed.yHoles, constraints.maxYHoles),
  };
}

function sanitizeFlatLBracketParams(
  params: FlatLBracketParams,
): FlatLBracketParams {
  return {
    xLength: clampNumber(
      params.xLength,
      minXLength,
      maxXLength,
      defaultFlatLBracketParams.xLength,
    ),
    yLength: clampNumber(
      params.yLength,
      minYLength,
      maxYLength,
      defaultFlatLBracketParams.yLength,
    ),
    legWidth: clampNumber(
      params.legWidth,
      minLegWidth,
      maxLegWidth,
      defaultFlatLBracketParams.legWidth,
    ),
    thickness: clampNumber(
      params.thickness,
      minThickness,
      maxThickness,
      defaultFlatLBracketParams.thickness,
    ),
    hardware: hardwareIds.includes(params.hardware)
      ? params.hardware
      : defaultFlatLBracketParams.hardware,
    holeStyle:
      params.holeStyle === "through" || params.holeStyle === "countersunk"
        ? params.holeStyle
        : defaultFlatLBracketParams.holeStyle,
    xHoles: clampInteger(
      params.xHoles,
      minHolesPerLeg,
      maxHolesPerLeg,
      defaultFlatLBracketParams.xHoles,
    ),
    yHoles: clampInteger(
      params.yHoles,
      minHolesPerLeg,
      maxHolesPerLeg,
      defaultFlatLBracketParams.yHoles,
    ),
    rows: clampInteger(
      params.rows,
      minRows,
      maxRowsPerLeg,
      defaultFlatLBracketParams.rows,
    ),
  };
}

export function buildFlatLBracketGeometry(
  params: FlatLBracketParams,
): BracketGeometry {
  const safeParams = normalizeFlatLBracketParams(params);
  const constraints = deriveFlatLBracketConstraints(safeParams);
  const plate = booleans.union(
    primitives.cuboid({
      center: [safeParams.xLength / 2, safeParams.legWidth / 2, 0],
      size: [safeParams.xLength, safeParams.legWidth, safeParams.thickness],
    }),
    primitives.cuboid({
      center: [safeParams.legWidth / 2, safeParams.yLength / 2, 0],
      size: [safeParams.legWidth, safeParams.yLength, safeParams.thickness],
    }),
  );
  const cutters = constraints.holeCenters.map((center) =>
    primitives.cylinder({
      center: [center.x, center.y, 0],
      height: safeParams.thickness + 3,
      radius: constraints.holeDiameter / 2,
      segments: 48,
    }),
  );
  const countersinkCutters =
    safeParams.holeStyle === "countersunk"
      ? constraints.holeCenters.map((center) =>
          primitives.cylinderElliptic({
            center: [
              center.x,
              center.y,
              safeParams.thickness / 2 - constraints.countersinkDepth / 2 + 0.1,
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
          }),
        )
      : [];

  const allCutters = [...cutters, ...countersinkCutters];
  const bracket =
    allCutters.length > 0 ? booleans.subtract(plate, ...allCutters) : plate;

  return colors.colorize([0.78, 0.68, 0.46, 1], bracket);
}

export function summarizeFlatLBracket(params: FlatLBracketParams) {
  const constraints = deriveFlatLBracketConstraints(
    normalizeFlatLBracketParams(params),
  );
  const geometry = buildFlatLBracketGeometry(params);
  const dimensions = measurements.measureDimensions(geometry);
  const volume = measurements.measureVolume(geometry);

  return {
    dimensions,
    volume,
    constraints,
  };
}

function countAlongLeg(
  length: number,
  legWidth: number,
  edgeClearance: number,
  minPitch: number,
) {
  const span = length - legWidth - edgeClearance * 2;

  if (span < 0) {
    return 1;
  }

  return Math.max(1, Math.floor(span / minPitch) + 1);
}

function centersForLeg(
  leg: "x" | "y",
  length: number,
  legWidth: number,
  edgeClearance: number,
  holeCount: number,
  rows: number,
): HoleCenter[] {
  const count = Math.max(1, holeCount);
  const start = legWidth + edgeClearance;
  const end = length - edgeClearance;
  const along =
    count === 1
      ? [(start + end) / 2]
      : Array.from(
          { length: count },
          (_, index) => start + ((end - start) * index) / (count - 1),
        );
  const across =
    rows === 1
      ? [legWidth / 2]
      : [edgeClearance, Math.max(edgeClearance, legWidth - edgeClearance)];

  return along.flatMap((primary) =>
    across.map((secondary) =>
      leg === "x"
        ? { x: primary, y: secondary, leg }
        : { x: secondary, y: primary, leg },
    ),
  );
}
