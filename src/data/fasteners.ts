/**
 * Fastener presets. Imperial values are in inches (source); resolve to mm via `toMm`.
 * Metric M-series are nominal diameters in mm.
 */

export type ImperialScrewSize =
  | '#0'
  | '#1'
  | '#2'
  | '#3'
  | '#4'
  | '#5'
  | '#6'
  | '#7'
  | '#8'
  | '#9'
  | '#10'
  | '#11'
  | '#12'

export type MetricBoltSize = 'M2' | 'M2.5' | 'M3' | 'M4' | 'M5' | 'M6' | 'M8'

export interface ImperialScrewPreset {
  readonly id: ImperialScrewSize
  /** Max head diameter, inches */
  readonly maxHeadDiameterIn: number
  /** Shank (clearance) diameter, inches */
  readonly shankDiameterIn: number
}

/** Table from product spec (imperial wood screws / generic). */
export const IMPERIAL_SCREW_PRESETS: readonly ImperialScrewPreset[] = [
  { id: '#0', maxHeadDiameterIn: 0.119, shankDiameterIn: 0.06 },
  { id: '#1', maxHeadDiameterIn: 0.146, shankDiameterIn: 0.073 },
  { id: '#2', maxHeadDiameterIn: 0.172, shankDiameterIn: 0.086 },
  { id: '#3', maxHeadDiameterIn: 0.199, shankDiameterIn: 0.099 },
  { id: '#4', maxHeadDiameterIn: 0.225, shankDiameterIn: 0.112 },
  { id: '#5', maxHeadDiameterIn: 0.252, shankDiameterIn: 0.125 },
  { id: '#6', maxHeadDiameterIn: 0.279, shankDiameterIn: 0.138 },
  { id: '#7', maxHeadDiameterIn: 0.305, shankDiameterIn: 0.151 },
  { id: '#8', maxHeadDiameterIn: 0.332, shankDiameterIn: 0.164 },
  { id: '#9', maxHeadDiameterIn: 0.358, shankDiameterIn: 0.177 },
  { id: '#10', maxHeadDiameterIn: 0.385, shankDiameterIn: 0.19 },
  { id: '#11', maxHeadDiameterIn: 0.411, shankDiameterIn: 0.203 },
  { id: '#12', maxHeadDiameterIn: 0.438, shankDiameterIn: 0.216 },
] as const

export interface MetricBoltPreset {
  readonly id: MetricBoltSize
  /** Nominal clearance hole diameter (mm), slightly over nominal thread. */
  readonly clearanceDiameterMm: number
}

export const METRIC_BOLT_PRESETS: readonly MetricBoltPreset[] = [
  { id: 'M2', clearanceDiameterMm: 2.4 },
  { id: 'M2.5', clearanceDiameterMm: 2.9 },
  { id: 'M3', clearanceDiameterMm: 3.4 },
  { id: 'M4', clearanceDiameterMm: 4.5 },
  { id: 'M5', clearanceDiameterMm: 5.5 },
  { id: 'M6', clearanceDiameterMm: 6.6 },
  { id: 'M8', clearanceDiameterMm: 9.0 },
] as const

const INCH_TO_MM = 25.4

export function inchesToMm(inches: number): number {
  return inches * INCH_TO_MM
}

export function imperialShankDiameterMm(size: ImperialScrewSize): number {
  const row = IMPERIAL_SCREW_PRESETS.find((p) => p.id === size)
  if (!row) throw new Error(`Unknown imperial size ${size}`)
  return inchesToMm(row.shankDiameterIn)
}
