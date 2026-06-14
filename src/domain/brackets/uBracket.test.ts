import {
  defaultUBracketParams,
  deriveUBracketConstraints,
  normalizeUBracketParams,
  summarizeUBracket,
} from "./uBracket";

describe("U bracket constraints", () => {
  it("keeps default base and mirrored upright holes valid", () => {
    const constraints = deriveUBracketConstraints(defaultUBracketParams);

    expect(constraints.valid).toBe(true);
    expect(constraints.holeCenters).toHaveLength(6);
    expect(
      constraints.holeCenters.filter((center) => center.face === "base"),
    ).toHaveLength(2);
    expect(
      constraints.holeCenters.filter((center) => center.face === "leftUpright"),
    ).toHaveLength(2);
    expect(
      constraints.holeCenters.filter(
        (center) => center.face === "rightUpright",
      ),
    ).toHaveLength(2);
  });

  it("clamps base holes between both upright flanges", () => {
    const normalized = normalizeUBracketParams({
      ...defaultUBracketParams,
      baseLength: 34,
      baseHoles: 6,
    });
    const constraints = deriveUBracketConstraints(normalized);

    expect(normalized.baseHoles).toBe(constraints.maxBaseHoles);
    expect(normalized.baseHoles).toBeLessThan(6);
  });

  it("allows compact U brackets with no holes", () => {
    const normalized = normalizeUBracketParams({
      ...defaultUBracketParams,
      baseLength: 10,
      uprightHeight: 10,
      baseHoles: 0,
      uprightHoles: 0,
    });
    const summary = summarizeUBracket(normalized);

    expect(normalized.baseLength).toBe(10);
    expect(normalized.uprightHeight).toBe(10);
    expect(summary.constraints.holeCenters).toHaveLength(0);
    expect(summary.volume).toBeGreaterThan(0);
  });

  it("supports angle-style gussets from both inside corners", () => {
    const compact = summarizeUBracket({
      ...defaultUBracketParams,
      legWidth: 180,
      gussetLayout: "quarterPair",
      gussetSizePercent: 25,
    });
    const full = summarizeUBracket({
      ...defaultUBracketParams,
      legWidth: 180,
      gussetLayout: "quarterPair",
      gussetSizePercent: 100,
    });

    expect(compact.constraints.selectedGussetOption.ribCount).toBe(2);
    expect(full.volume).toBeGreaterThan(compact.volume);
  });

  it("builds a printable solid with positive volume", () => {
    const summary = summarizeUBracket(defaultUBracketParams);

    expect(summary.volume).toBeGreaterThan(0);
    expect(summary.dimensions[0]).toBe(defaultUBracketParams.baseLength);
    expect(summary.dimensions[2]).toBe(defaultUBracketParams.uprightHeight);
  });

  it("falls back to through holes when the plate is too thin for countersinking", () => {
    const normalized = normalizeUBracketParams({
      ...defaultUBracketParams,
      holeStyle: "countersunk",
      thickness: 4,
      hardware: "m6",
    });

    expect(normalized.holeStyle).toBe("through");
  });
});
