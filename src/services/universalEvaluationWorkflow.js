import {
  calcUniversalEvaluation,
  getRuleById,
  getScoreGrade,
  universalRules,
} from '../config/rule.js'

const statusFromScore = (score) => score >= 5 ? 'PASS' : score >= 3 ? 'WARNING' : 'FAIL'

export const isLockedAutomaticResult = (result) => (
  result?.implementationStatus === 'REAL'
  && result?.evaluatedBy === 'LOCAL_GEOMETRY_ENGINE'
  && result?.rawScore !== null
  && result?.rawScore !== undefined
  && Number.isFinite(Number(result.rawScore))
)

export function createManualRuleResult(ruleId, value) {
  if (value === '' || value === null || value === undefined) return null
  if (value === 'NOT_APPLICABLE') {
    return {
      ruleId,
      status: 'NOT_APPLICABLE',
      rawScore: null,
      normalizedScore: null,
      confidence: 'MEDIUM',
      evidence: '评测人员确认本规则不适用于当前模型或当前评测模式。',
      evaluatedBy: 'MANUAL_REVIEWER',
      implementationStatus: 'MANUAL_CONFIRMED',
    }
  }

  const score = Math.min(Math.max(Number(value), 0), 5)
  return {
    ruleId,
    status: statusFromScore(score),
    rawScore: score,
    normalizedScore: score / 5,
    confidence: 'MEDIUM',
    evidence: '由评测人员结合当前模型视图和专业判断确认。',
    evaluatedBy: 'MANUAL_REVIEWER',
    implementationStatus: 'MANUAL_CONFIRMED',
  }
}

export function mergeUniversalRuleResults(automaticResult, manualResults = {}, mode = 'LOW_POLY_ONLY') {
  const automaticValues = Object.fromEntries((automaticResult?.ruleResults || []).map((result) => [result.ruleId, result]))
  return Object.fromEntries(
    universalRules
      .filter((rule) => rule.applicableModes.includes(mode))
      .map((rule) => {
        const automatic = automaticValues[rule.id]
        if (isLockedAutomaticResult(automatic)) return [rule.id, automatic]
        return [rule.id, manualResults[rule.id] || automatic || null]
      }),
  )
}

const createManualIssue = (result, index) => {
  const rule = getRuleById(result.ruleId)
  return {
    issueId: `MANUAL_ISSUE_${String(index + 1).padStart(3, '0')}`,
    ruleId: result.ruleId,
    dimensionId: rule?.dimensionId || 'UNKNOWN',
    location: { object: '当前模型', region: '人工复核区域' },
    severity: result.rawScore <= 1 ? rule?.defaultSeverity || 'MAJOR' : 'MINOR',
    confidence: result.confidence,
    evidence: result.evidence,
    consequence: `“${rule?.name || result.ruleId}”未达到满分，需要结合目标生产流程继续检查。`,
    suggestion: rule?.suggestions?.[0] || '根据规则说明修复后重新评测。',
    scoreDeduction: 5 - result.rawScore,
    heatmapValue: null,
    evaluatedBy: 'MANUAL_REVIEWER',
  }
}

export function buildUniversalEvaluationDraft({
  automaticResult,
  manualResults = {},
  mode = 'LOW_POLY_ONLY',
  modelName,
  modelFormat,
}) {
  const values = mergeUniversalRuleResults(automaticResult, manualResults, mode)
  const calculated = calcUniversalEvaluation(values, mode)
  const applicableRules = universalRules.filter((rule) => rule.applicableModes.includes(mode))
  const missingRuleIds = applicableRules
    .map((rule) => rule.id)
    .filter((ruleId) => {
      const result = values[ruleId]
      const hasScore = result?.rawScore !== null
        && result?.rawScore !== undefined
        && Number.isFinite(Number(result.rawScore))
      return !hasScore && result?.status !== 'NOT_APPLICABLE'
    })
  const lockedAutomaticCount = Object.values(values).filter(isLockedAutomaticResult).length
  const manualRuleResults = Object.values(values).filter((result) => result?.evaluatedBy === 'MANUAL_REVIEWER')
  const manualIssues = manualRuleResults
    .filter((result) => Number.isFinite(result.rawScore) && result.rawScore < 5)
    .map(createManualIssue)
  const grade = getScoreGrade(calculated.formalScore)

  return {
    values,
    readiness: {
      isComplete: calculated.isComplete && missingRuleIds.length === 0,
      coverage: calculated.coverage,
      completedRuleCount: calculated.completedRuleCount,
      applicableRuleCount: calculated.applicableRuleCount,
      evaluatedRuleCount: calculated.evaluatedRuleCount,
      notApplicableRuleCount: calculated.notApplicableRuleCount,
      lockedAutomaticCount,
      manualConfirmedCount: manualRuleResults.length,
      missingRuleIds,
      missingDimensionIds: calculated.missingDimensionIds,
    },
    result: {
      schemaVersion: '1.1.0',
      evaluationId: automaticResult?.evaluationId || `HYBRID_${Date.now()}`,
      rubricId: automaticResult?.rubricId || 'UNIVERSAL_RETOPO_V1',
      rubricVersion: automaticResult?.rubricVersion || 'UNIVERSAL_RETOPO_V1',
      evaluationState: calculated.isComplete ? 'COMPLETE_HYBRID' : 'DRAFT_HYBRID',
      model: automaticResult?.model || {
        modelId: `SESSION_${String(modelName || 'MODEL').replaceAll(/[^a-zA-Z0-9]/g, '_')}`,
        name: modelName || '当前模型',
        fileFormat: String(modelFormat || '').toUpperCase(),
        evaluationMode: mode,
      },
      meshStatistics: automaticResult?.meshStatistics || null,
      overallScore: calculated.formalScore,
      partialScore: calculated.totalScore,
      grade: calculated.formalScore === null ? null : grade.id,
      gradeName: calculated.formalScore === null ? null : grade.name,
      productionReadyBase: 'NOT_EVALUATED',
      evaluatedCoverage: calculated.coverage,
      confidence: calculated.isComplete ? 'MEDIUM_HIGH' : 'MEDIUM',
      evaluatedRuleCount: calculated.evaluatedRuleCount,
      completedRuleCount: calculated.completedRuleCount,
      reviewRequiredCount: missingRuleIds.length,
      applicableRuleCount: calculated.applicableRuleCount,
      dimensionScores: calculated.dimensionScores,
      ruleResults: Object.values(values).filter(Boolean),
      automaticRuleResults: automaticResult?.ruleResults || [],
      manualRuleResults,
      issues: [...(automaticResult?.issues || []), ...manualIssues],
      summary: {
        overallAssessment: calculated.isComplete
          ? `通用评测已完成：${lockedAutomaticCount} 条真实自动结果与 ${manualRuleResults.length} 条人工确认共同形成正式质量分。`
          : `通用评测草稿已完成 ${calculated.completedRuleCount}/${calculated.applicableRuleCount} 条规则。`,
        limitations: automaticResult?.summary?.limitations || [],
      },
      generatedAt: new Date().toISOString(),
    },
  }
}
