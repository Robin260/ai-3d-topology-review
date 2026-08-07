export type BaseReadiness = 'PASS' | 'CONDITIONAL_PASS' | 'FAIL' | 'NOT_EVALUATED'
export type SpecializedReadiness = 'READY' | 'CONDITIONAL' | 'BLOCKED' | 'NOT_EVALUATED'
export type IssueSeverity = 'FATAL' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO'

export interface SpecializedContext {
  modelSourceId?: string | null
  productionTargetId: string | null
  assetTypeId: string | null
  platformProfileId: string | null
  pipelineStageId?: string | null
}

export interface SpecializedDimensionResult {
  dimensionId: string
  score: number | null
  maxScore: number
  weight: number
  coverage: number
  evaluationStatus: 'EVALUATED' | 'PARTIAL' | 'NOT_EVALUATED'
}

export interface SpecializedEvaluationResult {
  rubricVersion: string
  score: number | null
  readiness: SpecializedReadiness
  dimensionResults: SpecializedDimensionResult[]
  issues: Array<{ id: string; severity: IssueSeverity; ruleId: string; message: string }>
}

export interface EvaluationSessionResult {
  evaluationSession: Record<string, unknown>
  modelMetadata: Record<string, unknown>
  modelSource: Record<string, unknown> | null
  baseEvaluation: Record<string, unknown>
  specializedContext: SpecializedContext
  specializedEvaluation: SpecializedEvaluationResult | null
}
