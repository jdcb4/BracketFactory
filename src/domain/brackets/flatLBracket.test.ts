import {
  defaultFlatLBracketParams,
  deriveFlatLBracketConstraints,
  normalizeFlatLBracketParams,
  summarizeFlatLBracket
} from "./flatLBracket";

describe("flat L bracket constraints", () => {
  it("keeps default holes valid and away from constrained zones", () => {
    const constraints = deriveFlatLBracketConstraints(defaultFlatLBracketParams);

    expect(constraints.valid).toBe(true);
    expect(constraints.holeCenters.length).toBe(5);
    constraints.holeCenters.forEach((center) => {
      expect(center.x).toBeGreaterThanOrEqual(constraints.edgeClearance);
      expect(center.y).toBeGreaterThanOrEqual(constraints.edgeClearance);
    });
  });

  it("clamps hole counts when a short leg cannot support the requested quantity", () => {
    const normalized = normalizeFlatLBracketParams({
      ...defaultFlatLBracketParams,
      xLength: 50,
      xHoles: 6
    });
    const constraints = deriveFlatLBracketConstraints(normalized);

    expect(normalized.xHoles).toBe(constraints.maxXHoles);
    expect(normalized.xHoles).toBeLessThan(6);
  });

  it("builds a printable solid with positive volume", () => {
    const summary = summarizeFlatLBracket(defaultFlatLBracketParams);

    expect(summary.volume).toBeGreaterThan(0);
    expect(summary.dimensions[2]).toBe(defaultFlatLBracketParams.thickness);
  });

  it("uses countersink head diameter for clearance and pitch limits", () => {
    const through = deriveFlatLBracketConstraints(defaultFlatLBracketParams);
    const countersunk = deriveFlatLBracketConstraints({
      ...defaultFlatLBracketParams,
      holeStyle: "countersunk"
    });

    expect(countersunk.headDiameter).toBeGreaterThan(countersunk.holeDiameter);
    expect(countersunk.edgeClearance).toBeGreaterThanOrEqual(through.edgeClearance);
    expect(countersunk.minPitch).toBeGreaterThanOrEqual(through.minPitch);
  });

  it("falls back to through holes when the plate is too thin for countersinking", () => {
    const normalized = normalizeFlatLBracketParams({
      ...defaultFlatLBracketParams,
      holeStyle: "countersunk",
      thickness: 3,
      hardware: "m6"
    });

    expect(normalized.holeStyle).toBe("through");
  });

  it("does not advertise more holes than the schema can accept on large brackets", () => {
    const constraints = deriveFlatLBracketConstraints({
      ...defaultFlatLBracketParams,
      xLength: 180,
      yLength: 180,
      legWidth: 60
    });

    expect(constraints.maxXHoles).toBeLessThanOrEqual(6);
    expect(constraints.maxYHoles).toBeLessThanOrEqual(6);
  });

  it("clamps oversized hole input instead of throwing", () => {
    const normalized = normalizeFlatLBracketParams({
      ...defaultFlatLBracketParams,
      xLength: 180,
      yLength: 180,
      xHoles: 99,
      yHoles: Number.NaN
    });

    expect(normalized.xHoles).toBe(6);
    expect(normalized.yHoles).toBe(defaultFlatLBracketParams.yHoles);
  });
});
