import universalRubric from '../../../config/rubrics/universal/rubric.json' with { type: 'json' }
import { storageService } from '../../../services/storageService.js'
import { analyticsMockSnapshots } from '../data/analyticsMock.js'

const dimensionArray = (dimensionScores = {}) => universalRubric.dimensions.map((dimension) => {
  const source = dimensionScores[dimension.id]
  const score = Number(source?.score ?? 0)
  return {
    dimensionId: dimension.id,
    dimensionName: dimension.name,
    score,
    maxScore: dimension.weight,
    percentage: dimension.weight > 0 ? score / dimension.weight * 100 : 0,
  }
})

export function adaptStorageRecord(record) {
  if (!record || record.type !== 'single') return null
  const result = record.universalResult || {}
  const scoreValue = record.totalScoreA ?? result.overallScore
  if (scoreValue === null || scoreValue === undefined || scoreValue === '') return null
  const totalScore = Number(scoreValue)
  if (!Number.isFinite(totalScore)) return null
  const model = record.modelA || result.model || {}
  const issues = Array.isArray(result.issues) ? result.issues : []
  const blockingIssues = issues.filter((issue) => ['FATAL', 'CRITICAL', 'BLOCKING'].includes(issue.severity) || issue.blocking)

  return {
    snapshotId: record.id,
    modelId: model.modelId || model.id || record.id,
    modelName: model.name || '未命名模型',
    modelVersionId: model.versionId || `${model.modelId || record.id}_unknown`,
    modelVersion: model.version || '未标注版本',
    source: {
      type: model.sourceType || 'UNKNOWN',
      generatorId: model.generatorId,
      generatorName: model.generatorName || model.sourceLabel || '未标注来源',
    },
    evaluationContext: {
      productionTargetId: record.productionContext?.productionTargetId || record.productionContext?.targetId || 'UNSPECIFIED',
      productionTargetName: record.productionContext?.targetName || '未标注生产目标',
      assetTypeId: record.productionContext?.assetTypeId || 'UNSPECIFIED',
      assetTypeName: record.productionContext?.assetTypeName || '未标注资产类型',
    },
    rubric: { rubricId: result.rubricId || record.rubricVersion, rubricVersion: result.rubricVersion || record.rubricVersion },
    result: {
      totalScore,
      maxScore: 100,
      grade: record.gradeA || result.grade || '未评级',
      pass: totalScore >= 60,
      productionReady: ['ready', 'deliverable', 'PASS'].includes(record.deliveryStatus || result.productionReadyBase),
      blockingIssueCount: blockingIssues.length,
    },
    dimensionScores: dimensionArray(record.scoresA || result.dimensionScores),
    issues: issues.map((issue, index) => ({
      issueId: issue.issueId || `${record.id}_ISSUE_${index + 1}`,
      issueCode: issue.issueCode || issue.ruleId || 'UNKNOWN_ISSUE',
      ruleId: issue.ruleId || 'UNKNOWN_RULE',
      dimensionId: issue.dimensionId || 'UNKNOWN_DIMENSION',
      title: issue.title || issue.evidence || issue.ruleId || '未命名问题',
      severity: issue.severity || 'INFO',
      blocking: Boolean(issue.blocking || ['FATAL', 'CRITICAL', 'BLOCKING'].includes(issue.severity)),
      affectedArea: issue.location?.region || issue.affectedArea,
      suggestion: issue.suggestion,
    })),
    evaluatedAt: record.updatedAt || record.createdAt,
    createdAt: record.createdAt,
    metadata: { source: 'local', adaptedFromStorageVersion: storageService.keys.version },
  }
}

export function loadAnalyticsDataset() {
  const records = storageService.getRecords()
  const snapshots = records.map(adaptStorageRecord).filter(Boolean)
  const pendingRecords = storageService.getPendingRecords()
  if (snapshots.length > 0) return { snapshots, pendingRecords, source: 'local', rejectedCount: records.length - snapshots.length }
  return { snapshots: analyticsMockSnapshots, pendingRecords, source: 'mock', rejectedCount: records.length }
}
