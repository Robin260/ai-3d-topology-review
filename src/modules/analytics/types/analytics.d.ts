export interface EvaluationSnapshot {
  snapshotId: string
  modelId: string
  modelName: string
  modelVersionId: string
  modelVersion: string
  source: { type: string; generatorId?: string; generatorName?: string; generatorVersion?: string }
  evaluationContext: {
    productionTargetId: string
    productionTargetName: string
    assetTypeId: string
    assetTypeName: string
  }
  rubric: { rubricId: string; rubricVersion: string }
  result: {
    totalScore: number
    maxScore: number
    grade: string
    pass: boolean
    productionReady: boolean
    blockingIssueCount: number
  }
  dimensionScores: DimensionScore[]
  issues: EvaluationIssue[]
  evaluatedAt: string
  createdAt: string
  metadata?: Record<string, unknown>
  extensions?: Record<string, unknown>
}

export interface DimensionScore {
  dimensionId: string
  dimensionName: string
  score: number
  maxScore: number
  percentage: number
}

export interface EvaluationIssue {
  issueId: string
  issueCode: string
  ruleId: string
  dimensionId: string
  title: string
  severity: string
  blocking: boolean
  affectedArea?: string
  suggestion?: string
}
