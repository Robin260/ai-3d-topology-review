import { getScoreGrade } from '../config/rule.js'
import { composeSpecializedRubric } from './rubricService.js'
import { createManualRuleResult } from './universalEvaluationWorkflow.js'

const reusedDimensionMap = {
  UNIVERSAL_MESH_HEALTH: 'MESH_HEALTH',
  UNIVERSAL_SILHOUETTE: 'SHAPE_FIDELITY',
  UNIVERSAL_NORMAL_BASE: 'SURFACE_QUALITY',
}

const createReusedResult = (rule, universalResult) => {
  const dimensionId = reusedDimensionMap[rule.id]
  const dimension = universalResult?.dimensionScores?.[dimensionId]
  if (!dimension || dimension.score === null) return null
  const rawScore = Math.max(0, Math.min(5, dimension.score / dimension.maximum * 5))
  return {
    ruleId: rule.id,
    status: rawScore >= 4.5 ? 'PASS' : rawScore >= 3 ? 'WARNING' : 'FAIL',
    rawScore: Number(rawScore.toFixed(2)),
    normalizedScore: rawScore / 5,
    confidence: universalResult.confidence || 'MEDIUM_HIGH',
    evidence: `复用通用维度“${dimensionId}”结果 ${dimension.score.toFixed(1)} / ${dimension.maximum}。`,
    evaluatedBy: 'UNIVERSAL_RESULT_REUSE',
    implementationStatus: 'REUSED_RESULT',
  }
}

const hasResolvedValue = (result) => (
  result?.status === 'NOT_APPLICABLE'
  || (result?.rawScore !== null && result?.rawScore !== undefined && Number.isFinite(Number(result.rawScore)))
)

export function buildSpecializedEvaluationDraft({ context, universalResult, manualResults = {} }) {
  const rubric = composeSpecializedRubric(context)
  if (!rubric.ready || universalResult?.overallScore === null || universalResult?.overallScore === undefined) {
    return { rubric, values: {}, readiness: null, result: null }
  }

  const values = Object.fromEntries(rubric.rules.map((rule) => [
    rule.id,
    rule.source === 'UNIVERSAL_REUSED'
      ? createReusedResult(rule, universalResult)
      : manualResults[rule.id] || null,
  ]))
  const missingRuleIds = rubric.rules.map((rule) => rule.id).filter((ruleId) => !hasResolvedValue(values[ruleId]))
  const resolvedResults = Object.values(values).filter(hasResolvedValue)
  const scoredResults = resolvedResults.filter((result) => Number.isFinite(result.rawScore))
  const manualRuleResults = scoredResults.filter((result) => result.evaluatedBy === 'MANUAL_REVIEWER')
  const reusedRuleResults = scoredResults.filter((result) => result.evaluatedBy === 'UNIVERSAL_RESULT_REUSE')
  const isComplete = missingRuleIds.length === 0 && scoredResults.length > 0
  const score = scoredResults.length
    ? scoredResults.reduce((sum, result) => sum + Number(result.rawScore), 0) / (scoredResults.length * 5) * 100
    : null
  const grade = getScoreGrade(isComplete ? score : null)

  return {
    rubric,
    values,
    readiness: {
      isComplete,
      coverage: rubric.rules.length ? resolvedResults.length / rubric.rules.length : 0,
      completedRuleCount: resolvedResults.length,
      applicableRuleCount: rubric.rules.length,
      reusedRuleCount: reusedRuleResults.length,
      manualConfirmedCount: manualRuleResults.length,
      missingRuleIds,
    },
    result: {
      schemaVersion: '1.0.0',
      evaluationId: `SPECIALIZED_${Date.now()}`,
      rubricVersion: rubric.rubricVersion,
      profileId: rubric.profileId,
      evaluationState: isComplete ? 'COMPLETE_MANUAL_WITH_REUSE' : 'DRAFT_MANUAL_WITH_REUSE',
      overallScore: isComplete ? Number(score.toFixed(1)) : null,
      partialScore: score === null ? null : Number(score.toFixed(1)),
      grade: isComplete ? grade.id : null,
      gradeName: isComplete ? grade.name : null,
      confidence: 'MEDIUM',
      scoringMethod: 'EQUAL_WEIGHT_PER_COMPOSED_RULE_V1',
      ruleResults: scoredResults,
      reusedRuleResults,
      manualRuleResults,
      context: rubric.context,
      generatedAt: new Date().toISOString(),
    },
  }
}

export function confirmRemainingSpecializedRules(draft, current = {}) {
  const next = { ...current }
  draft?.readiness?.missingRuleIds.forEach((ruleId) => {
    next[ruleId] = createManualRuleResult(ruleId, 5)
  })
  return next
}

