export type FairnessStatus = 'valid' | 'valid_with_warnings' | 'low_confidence' | 'invalid'
export type DifferenceLevel = 'tie' | 'slight_advantage' | 'clear_advantage' | 'significant_advantage'
export type Winner = 'A' | 'B' | 'tie' | 'undetermined'
export type DeliveryStatus = 'ready' | 'ready_with_minor_fixes' | 'not_ready' | 'blocked' | 'insufficient_data'

export interface DimensionComparison {
  dimensionId: string
  label: string
  modelA: number | null
  modelB: number | null
  maximum: number
  normalizedA: number | null
  normalizedB: number | null
  delta: number | null
  winner: Winner | 'insufficient_data'
  differenceLevel: DifferenceLevel
  weight: number
}

export interface ComparisonRecord {
  comparisonId: string
  referenceModelId: string
  modelAResultId: string
  modelBResultId: string
  productionTarget: string
  standardProfileId: string
  evaluationVersion: string
  comparisonRuleVersion: string
  fairness: Record<string, unknown>
  dimensions: DimensionComparison[]
  blockingIssues: Record<string, unknown>
  confidence: Record<string, unknown>
  winners: Record<string, Winner | 'neither' | 'manual_review'>
  recommendation: Record<string, unknown>
  roleFeedback: Array<Record<string, unknown>>
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
  extensions?: Record<string, unknown>
}
