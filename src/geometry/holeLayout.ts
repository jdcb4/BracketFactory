import { holeCenters1dGrid } from './holeOps'

/** Minimum center-to-center distance between two hole rows (hole walls stay separated). */
export function minHoleRowPitchMm(holeDiameterMm: number, minHoleEdgeClearanceMm: number): number {
  return holeDiameterMm + 2 * minHoleEdgeClearanceMm
}

/**
 * Upper bound on how many parallel hole rows fit across `widthMm` (Y) with the same edge rules as 1D grids.
 * Uses the same margin rule as `holeCenters1dGrid`.
 */
export function maxHoleRowsAlongWidth(
  widthMm: number,
  holeDiameterMm: number,
  edgeOffsetMm: number,
  minHoleEdgeClearanceMm: number,
): number {
  const holeR = holeDiameterMm / 2
  const margin = Math.max(edgeOffsetMm, holeR + minHoleEdgeClearanceMm)
  const lo = margin
  const hi = widthMm - margin
  if (hi <= lo) return 1
  const pitch = minHoleRowPitchMm(holeDiameterMm, minHoleEdgeClearanceMm)
  return 1 + Math.floor((hi - lo) / pitch)
}

/** Row centers across bracket width (Y), same helper as leg hole spacing along length. */
export function holeRowCentersAlongWidth(
  rowCount: number,
  widthMm: number,
  edgeOffsetMm: number,
  holeRadius: number,
  minHoleEdgeClearanceMm: number,
): number[] {
  const n = Math.max(1, Math.round(rowCount))
  return holeCenters1dGrid(n, widthMm, edgeOffsetMm, 0, holeRadius, minHoleEdgeClearanceMm)
}

/** Minimum |gusset center Y − hole row Y| so the gusset prism clears hole cylinders in Y. */
function minCenterSeparationGussetFromHoleRow(holeRadius: number, gussetThicknessMm: number, minGapMm: number): number {
  return holeRadius + gussetThicknessMm / 2 + minGapMm
}

/**
 * Gusset Y-centers **between** hole rows: midpoints of gaps between consecutive rows first, then end gaps.
 * Does not move hole rows (holes stay symmetric / centered as computed by `holeRowCentersAlongWidth`).
 */
export function gussetCenterYsBetweenHoleRows(
  widthMm: number,
  requestedCount: number,
  gussetThicknessMm: number,
  holeRowCenters: number[],
  holeRadius: number,
  minGapMm: number,
): number[] {
  const gT = Math.max(0.2, gussetThicknessMm)
  const half = gT / 2
  const sep = minCenterSeparationGussetFromHoleRow(holeRadius, gT, minGapMm)
  const minSpacing = gT + 0.25

  const rows = [...holeRowCenters].sort((a, b) => a - b)
  const fits = (yc: number) =>
    yc >= half &&
    yc <= widthMm - half &&
    rows.every((hr) => Math.abs(yc - hr) >= sep)

  const candidates: number[] = []

  // 1) Between consecutive hole rows (preferred).
  for (let i = 0; i < rows.length - 1; i++) {
    const m = (rows[i] + rows[i + 1]) / 2
    if (fits(m)) candidates.push(m)
  }

  // 2) End caps: space before the first row and after the last row (when multiple rows or single row).
  const lo = half
  const hi = widthMm - half
  if (rows.length > 0) {
    const first = rows[0]
    const last = rows[rows.length - 1]
    if (first - sep > lo) candidates.push((lo + first - sep) / 2)
    if (last + sep < hi) candidates.push((last + sep + hi) / 2)
  }

  const uniq = [...new Set(candidates.map((x) => Math.round(x * 1000) / 1000))]
    .filter(fits)
    .sort((a, b) => a - b)

  const picked: number[] = []
  for (const c of uniq) {
    if (picked.every((p) => Math.abs(c - p) >= minSpacing)) {
      picked.push(c)
      if (picked.length >= requestedCount) break
    }
  }
  return picked.slice(0, Math.max(0, requestedCount))
}
