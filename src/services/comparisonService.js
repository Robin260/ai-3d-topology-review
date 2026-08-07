import { comparisonConfig } from '../config/comparison/comparisonConfig.js'
import { roleFeedbackConfig } from '../config/comparison/roleFeedbackConfig.js'
import universalRubric from '../config/rubrics/universal/rubric.json' with { type: 'json' }
import { compareEvaluationResults } from './comparisonEngine.js'
import { calculateComparisonConfidence } from './confidenceEngine.js'
import { evaluateFairness } from './fairnessEngine.js'
import { createRecommendation } from './recommendationEngine.js'
import { createRoleFeedback } from './roleFeedbackEngine.js'

export function buildComparisonRecord(input) {
  const fairness = evaluateFairness(input.fairnessContext, comparisonConfig.fairnessRules)
  const comparison = compareEvaluationResults(
    input.modelA,
    input.modelB,
    universalRubric.dimensions,
    comparisonConfig.differenceThresholds,
  )
  const confidence = calculateComparisonConfidence({
    fairness,
    modelA: input.modelA,
    modelB: input.modelB,
    missingEvidence: input.missingEvidence || [],
  }, comparisonConfig.confidence)
  const recommendation = createRecommendation({
    fairness,
    comparison,
    modelA: input.modelA,
    modelB: input.modelB,
    blockersA: input.blockersA || [],
    blockersB: input.blockersB || [],
  })
  const roleFeedback = createRoleFeedback(recommendation.winners.overallWinner, roleFeedbackConfig)
  const now = new Date().toISOString()

  return {
    comparisonId: input.comparisonId,
    referenceModelId: input.referenceModelId,
    modelAResultId: input.modelA.evaluationId,
    modelBResultId: input.modelB.evaluationId,
    productionTarget: input.productionTarget,
    standardProfileId: input.standardProfileId,
    evaluationVersion: input.evaluationVersion,
    comparisonRuleVersion: comparisonConfig.version,
    modelA: input.modelA,
    modelB: input.modelB,
    fairness,
    dimensions: comparison.dimensions,
    totalDelta: comparison.totalDelta,
    totalLevel: comparison.totalLevel,
    blockingIssues: { A: input.blockersA || [], B: input.blockersB || [] },
    confidence,
    winners: recommendation.winners,
    delivery: recommendation.delivery,
    recommendation: { rationale: recommendation.rationale },
    roleFeedback,
    metadata: input.metadata || {},
    createdAt: now,
    updatedAt: now,
  }
}
