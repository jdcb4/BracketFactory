/**
 * Template types (mirror JSON; validated at build with Ajv + runtime Zod where needed).
 */

export type ParameterGroup =
  | 'dimensions'
  | 'hardware'
  | 'fit'
  | 'reinforcement'
  | 'print'
  | 'advanced'

export type ParameterType = 'number' | 'integer' | 'boolean' | 'select' | 'string'

export interface SelectOption {
  readonly value: string
  readonly label: string
}

export interface TemplateParameter {
  readonly key: string
  readonly label: string
  readonly type: ParameterType
  readonly default: string | number | boolean
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly group: ParameterGroup
  readonly unit?: string
  readonly advanced?: boolean
  readonly options?: readonly SelectOption[]
  readonly uiHint?: string
}

export interface TemplatePreviewMeta {
  readonly cameraPosition: readonly [number, number, number]
  readonly target: readonly [number, number, number]
}

export interface BracketTemplate {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: string
  readonly version: string
  readonly generationStrategy: string
  readonly units: 'mm'
  readonly disabled?: boolean
  readonly disabledReason?: string
  readonly parameters: readonly TemplateParameter[]
  readonly preview: TemplatePreviewMeta
}
