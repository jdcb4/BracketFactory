import {
  defaultAngleBracketParams,
  deriveAngleBracketConstraints,
  normalizeAngleBracketParams,
  summarizeAngleBracket,
} from "./angleBracket";

describe("angle bracket constraints", () => {
  it("keeps default holes valid with gussets off", () => {
    const constraints = deriveAngleBracketConstraints(
      defaultAngleBracketParams,
    );

    expect(constraints.valid).toBe(true);
    expect(constraints.holeCenters.length).toBe(4);
    expect(defaultAngleBracketParams.gussetLayout).toBe("none");
    expect(constraints.selectedGussetOption.ribCount).toBe(0);
    constraints.holeCenters.forEach((center) => {
      expect(center.y).toBeGreaterThanOrEqual(constraints.edgeClearance);
    });
  });

  it("clamps hole counts and clears blocked gusset layouts", () => {
    const normalized = normalizeAngleBracketParams({
      ...defaultAngleBracketParams,
      baseLength: 50,
      uprightHeight: 50,
      legWidth: 26,
      baseHoles: 6,
      uprightHoles: 6,
      rows: 2,
      gussetLayout: "quarterPair",
    });
    const constraints = deriveAngleBracketConstraints(normalized);

    expect(normalized.baseHoles).toBe(constraints.maxBaseHoles);
    expect(normalized.uprightHoles).toBe(constraints.maxUprightHoles);
    expect(normalized.gussetLayout).toBe("none");
  });

  it("does not advertise more holes than the schema can accept on large brackets", () => {
    const constraints = deriveAngleBracketConstraints({
      ...defaultAngleBracketParams,
      baseLength: 180,
      uprightHeight: 160,
      legWidth: 300,
    });

    expect(constraints.maxBaseHoles).toBeLessThanOrEqual(6);
    expect(constraints.maxUprightHoles).toBeLessThanOrEqual(6);
  });

  it("allows 10 mm flanges with no holes", () => {
    const normalized = normalizeAngleBracketParams({
      ...defaultAngleBracketParams,
      baseLength: 10,
      uprightHeight: 10,
      baseHoles: 0,
      uprightHoles: 0,
    });
    const summary = summarizeAngleBracket(normalized);

    expect(normalized.baseLength).toBe(10);
    expect(normalized.uprightHeight).toBe(10);
    expect(normalized.baseHoles).toBe(0);
    expect(normalized.uprightHoles).toBe(0);
    expect(summary.constraints.holeCenters).toHaveLength(0);
    expect(summary.volume).toBeGreaterThan(0);
  });

  it("clamps holes to zero when a flange is too short for safe placement", () => {
    const normalized = normalizeAngleBracketParams({
      ...defaultAngleBracketParams,
      baseLength: 10,
      uprightHeight: 10,
      baseHoles: 6,
      uprightHoles: 6,
    });
    const constraints = deriveAngleBracketConstraints(normalized);

    expect(constraints.maxBaseHoles).toBe(0);
    expect(constraints.maxUprightHoles).toBe(0);
    expect(normalized.baseHoles).toBe(0);
    expect(normalized.uprightHoles).toBe(0);
  });

  it("allows wide angle brackets up to 300 mm", () => {
    const normalized = normalizeAngleBracketParams({
      ...defaultAngleBracketParams,
      legWidth: 999,
    });

    expect(normalized.legWidth).toBe(300);
  });

  it("derives more than two hole rows on wide brackets", () => {
    const constraints = deriveAngleBracketConstraints({
      ...defaultAngleBracketParams,
      legWidth: 300,
    });

    expect(constraints.maxRows).toBeGreaterThan(2);
  });

  it("supports quarter-width gusset pairs on wide brackets", () => {
    const normalized = normalizeAngleBracketParams({
      ...defaultAngleBracketParams,
      legWidth: 180,
      gussetLayout: "quarterPair",
    });
    const constraints = deriveAngleBracketConstraints(normalized);

    expect(normalized.gussetLayout).toBe("quarterPair");
    expect(constraints.selectedGussetOption.centers).toEqual([45, 135]);
  });

  it("blocks gusset layouts that cross protected hole rows", () => {
    const constraints = deriveAngleBracketConstraints({
      ...defaultAngleBracketParams,
      legWidth: 80,
      rows: 1,
      gussetLayout: "center",
    });
    const normalized = normalizeAngleBracketParams({
      ...defaultAngleBracketParams,
      legWidth: 80,
      rows: 1,
      gussetLayout: "center",
    });

    expect(
      constraints.gussetOptions.find((option) => option.id === "center")
        ?.available,
    ).toBe(false);
    expect(normalized.gussetLayout).toBe("none");
  });

  it("uses gusset size percentage to scale rib reach", () => {
    const compact = summarizeAngleBracket({
      ...defaultAngleBracketParams,
      legWidth: 180,
      gussetLayout: "quarterPair",
      gussetSizePercent: 25,
    });
    const full = summarizeAngleBracket({
      ...defaultAngleBracketParams,
      legWidth: 180,
      gussetLayout: "quarterPair",
      gussetSizePercent: 100,
    });

    expect(full.volume).toBeGreaterThan(compact.volume);
  });

  it("builds a printable solid with positive volume", () => {
    const summary = summarizeAngleBracket(defaultAngleBracketParams);

    expect(summary.volume).toBeGreaterThan(0);
    expect(summary.dimensions[0]).toBe(defaultAngleBracketParams.baseLength);
    expect(summary.dimensions[2]).toBe(defaultAngleBracketParams.uprightHeight);
  });

  it("falls back to through holes when the plate is too thin for countersinking", () => {
    const normalized = normalizeAngleBracketParams({
      ...defaultAngleBracketParams,
      holeStyle: "countersunk",
      thickness: 4,
      hardware: "m6",
    });

    expect(normalized.holeStyle).toBe("through");
  });

  it("builds a valid countersunk angle bracket when thickness allows it", () => {
    const normalized = normalizeAngleBracketParams({
      ...defaultAngleBracketParams,
      holeStyle: "countersunk",
      thickness: 8,
      hardware: "m5",
    });
    const summary = summarizeAngleBracket(normalized);

    expect(normalized.holeStyle).toBe("countersunk");
    expect(summary.volume).toBeGreaterThan(0);
    expect(summary.constraints.countersinkAvailable).toBe(true);
  });

  it("keeps countersunk holes valid on both angle bracket faces", () => {
    const summary = summarizeAngleBracket({
      ...defaultAngleBracketParams,
      holeStyle: "countersunk",
      thickness: 8,
      hardware: "m5",
      baseHoles: 1,
      uprightHoles: 1,
    });

    expect(summary.constraints.holeCenters.some((hole) => hole.face === "base"))
      .toBe(true);
    expect(
      summary.constraints.holeCenters.some((hole) => hole.face === "upright"),
    ).toBe(true);
    expect(summary.volume).toBeGreaterThan(0);
  });
});
