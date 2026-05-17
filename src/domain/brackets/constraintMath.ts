export function roundUp(value: number, increment: number) {
  return Math.ceil(value / increment) * increment;
}

export function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export function clampInteger(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  return Math.round(clampNumber(value, min, max, fallback));
}
