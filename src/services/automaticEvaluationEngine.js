import {
  AUTOMATIC_EVALUATION_VERSION,
  automaticEvaluationPolicy,
  calcUniversalEvaluation,
  getRuleById,
  universalRules,
} from '../config/rule.js'

const statusFromScore = (score) => score >= 5 ? 'PASS' : score >= 3 ? 'WARNING' : 'FAIL'
const severityFromScore = (score, fallback) => score <= 1 ? fallback : score <= 3 ? 'MAJOR' : 'MINOR'
const ratio = (count, total) => total > 0 ? count / total : 0

const scoreMetric = (value, bands) => bands.find((band) => value <= band.max)?.score ?? 0

const buildRuleResult = (ruleId, metricValue, evidence) => {
  const policy = automaticEvaluationPolicy.rules[ruleId]
  const score = scoreMetric(metricValue, policy.bands)
  return {
    ruleId,
    status: statusFromScore(score),
    rawScore: score,
    normalizedScore: score / 5,
    confidence: 'HIGH',
    evidence,
    evaluatedBy: 'LOCAL_GEOMETRY_ENGINE',
    implementationStatus: 'REAL',
  }
}

const buildReviewResult = (ruleId, evidence, reason) => ({
  ruleId,
  status: 'REVIEW_REQUIRED',
  rawScore: null,
  normalizedScore: null,
  confidence: 'LOW',
  evidence,
  reason,
  evaluatedBy: 'LOCAL_GEOMETRY_ENGINE',
  implementationStatus: 'PARTIAL_EVIDENCE',
})

const issueText = {
  MH_NON_MANIFOLD: {
    consequence: '可能造成绑定、导出、布尔运算或引擎导入失败。',
    suggestion: '检查多面共边和异常连接，拆分或重新焊接问题区域。',
  },
  MH_DUPLICATE: {
    consequence: '可能造成闪烁、法线异常、烘焙重影和无效计算。',
    suggestion: '删除完全重复面，并检查镜像、复制和合并操作的残留。',
  },
  MH_ZERO_AREA: {
    consequence: '可能在导出、三角化或法线计算时产生不稳定结果。',
    suggestion: '删除零面积面、合并重合顶点，并重新构建局部网格。',
  },
  MH_DEGENERATE: {
    consequence: '极端细长三角面容易造成阴影波动、编辑困难和数值不稳定。',
    suggestion: '调整局部顶点和边长，避免极端狭长或近乎折叠的面。',
  },
  DE_ASPECT_RATIO: {
    consequence: '较差的三角面形状会降低有限面数的利用效率。',
    suggestion: '重新分配局部顶点，使三角面形状更均衡。',
  },
}

const buildIssue = (result, index) => {
  const rule = getRuleById(result.ruleId)
  const text = issueText[result.ruleId]
  return {
    issueId: `AUTO_ISSUE_${String(index + 1).padStart(3, '0')}`,
    ruleId: result.ruleId,
    dimensionId: rule?.dimensionId || 'UNKNOWN',
    location: { object: '模型整体', region: '待接入区域定位' },
    severity: severityFromScore(result.rawScore, rule?.defaultSeverity || 'MAJOR'),
    confidence: result.confidence,
    evidence: Object.entries(result.evidence).map(([key, value]) => `${key}: ${value}`).join('；'),
    consequence: text?.consequence || '可能影响后续生产流程。',
    suggestion: text?.suggestion || rule?.suggestions?.[0] || '请人工复核该问题。',
    scoreDeduction: 5 - result.rawScore,
    heatmapValue: null,
  }
}

export function generateAutomaticEvaluation({ analysis, modelName, modelFormat, evaluationMode = 'LOW_POLY_ONLY' }) {
  if (!analysis || analysis.triangleCount <= 0) return null

  const metrics = {
    nonManifoldEdgeRatio: ratio(analysis.nonManifoldEdgeCount, Math.max(analysis.triangleCount * 3, 1)),
    duplicateFaceRatio: ratio(analysis.duplicateFaceCount, analysis.triangleCount),
    degenerateTriangleRatio: ratio(analysis.degenerateTriangleCount, analysis.triangleCount),
    sliverTriangleRatio: ratio(analysis.sliverTriangleCount, analysis.triangleCount),
  }

  const ruleResults = []
  if (analysis.topologyAnalysisComplete) {
    ruleResults.push(buildRuleResult('MH_NON_MANIFOLD', metrics.nonManifoldEdgeRatio, {
      nonManifoldEdgeCount: analysis.nonManifoldEdgeCount,
      nonManifoldVertexCount: analysis.nonManifoldVertexCount,
    }))
    ruleResults.push(buildRuleResult('MH_DUPLICATE', metrics.duplicateFaceRatio, {
      duplicateFaceCount: analysis.duplicateFaceCount,
      duplicateFaceRatio: Number(metrics.duplicateFaceRatio.toFixed(6)),
    }))
  }
  ruleResults.push(buildRuleResult('MH_ZERO_AREA', metrics.degenerateTriangleRatio, {
    zeroAreaFaceCount: analysis.degenerateTriangleCount,
    zeroAreaFaceRatio: Number(metrics.degenerateTriangleRatio.toFixed(6)),
  }))
  ruleResults.push(buildRuleResult('MH_DEGENERATE', metrics.sliverTriangleRatio, {
    sliverTriangleCount: analysis.sliverTriangleCount,
    sliverTriangleRatio: Number(metrics.sliverTriangleRatio.toFixed(6)),
    minimumTriangleQuality: Number(analysis.minimumTriangleQuality.toFixed(6)),
  }))
  ruleResults.push(buildRuleResult('DE_ASPECT_RATIO', metrics.sliverTriangleRatio, {
    poorAspectFaceCount: analysis.sliverTriangleCount,
    poorAspectFaceRatio: Number(metrics.sliverTriangleRatio.toFixed(6)),
  }))

  if (analysis.boundaryEdgeCount > 0) {
    ruleResults.push(buildReviewResult('MH_HOLES', {
      openBoundaryEdgeCount: analysis.boundaryEdgeCount,
    }, '检测到开放边界，但系统不知道它是设计开口还是破洞，因此不自动扣分。'))
  }
  if (analysis.missingNormalMeshCount > 0 || analysis.invalidNormalCount > 0) {
    ruleResults.push(buildReviewResult('MH_NORMAL_DIRECTION', {
      missingNormalMeshCount: analysis.missingNormalMeshCount,
      invalidNormalCount: analysis.invalidNormalCount,
    }, '读取到法线属性风险，但仅凭加载结果不能确认法线是否整体翻转。'))
  }

  const calculated = calcUniversalEvaluation(
    Object.fromEntries(ruleResults.map((result) => [result.ruleId, result])),
    evaluationMode,
  )
  const applicableRuleCount = universalRules.filter((rule) => rule.applicableModes.includes(evaluationMode)).length
  const evaluatedRuleResults = ruleResults.filter((result) => Number.isFinite(result.rawScore))
  const evaluatedDimensionWeight = Object.values(calculated.dimensionScores)
    .filter((dimension) => dimension.score !== null)
    .reduce((sum, dimension) => sum + dimension.maximum, 0)
  const partialScore = evaluatedDimensionWeight > 0
    ? calculated.totalScore / evaluatedDimensionWeight * 100
    : null
  const issues = evaluatedRuleResults
    .filter((result) => result.status !== 'PASS')
    .map(buildIssue)

  const strengths = evaluatedRuleResults
    .filter((result) => result.status === 'PASS')
    .map((result) => `${getRuleById(result.ruleId)?.name || result.ruleId}未发现可直接确认的问题。`)
  const weaknesses = issues.map((issue) => `${getRuleById(issue.ruleId)?.name || issue.ruleId}需要处理：${issue.suggestion}`)

  return {
    schemaVersion: '1.0.0',
    evaluationId: `AUTO_${Date.now()}`,
    rubricId: 'UNIVERSAL_RETOPO_V1',
    rubricVersion: AUTOMATIC_EVALUATION_VERSION,
    evaluationState: 'PARTIAL_AUTOMATIC',
    model: {
      modelId: `SESSION_${String(modelName || 'MODEL').replaceAll(/[^a-zA-Z0-9]/g, '_')}`,
      name: modelName || '当前导入模型',
      fileFormat: String(modelFormat || '').toUpperCase(),
      evaluationMode,
    },
    meshStatistics: analysis,
    overallScore: null,
    partialScore: partialScore === null ? null : Number(partialScore.toFixed(1)),
    grade: null,
    productionReadyBase: 'NOT_EVALUATED',
    evaluatedCoverage: applicableRuleCount ? evaluatedRuleResults.length / applicableRuleCount : 0,
    confidence: 'HIGH',
    evaluatedRuleCount: evaluatedRuleResults.length,
    reviewRequiredCount: ruleResults.filter((result) => result.status === 'REVIEW_REQUIRED').length,
    applicableRuleCount,
    dimensionScores: calculated.dimensionScores,
    ruleResults,
    issues,
    summary: {
      overallAssessment: `浏览器已完成 ${evaluatedRuleResults.length} 条可可靠规则的自动判断；其余规则保持未评测。`,
      strengths,
      weaknesses,
      priorityActions: issues.map((issue, index) => ({
        priority: index + 1,
        action: issue.suggestion,
        relatedRuleIds: [issue.ruleId],
      })),
      limitations: [
        '当前没有运行 AI 视觉模型，不能判断轮廓、形体和边流美术质量。',
        '加载后的模型通常已经三角化，不能据此恢复原始四边面结构。',
        '没有参考高模时，不能判断高低模还原误差。',
        '覆盖率不足时不生成正式等级和交付状态。',
      ],
    },
    generatedAt: new Date().toISOString(),
  }
}

export default generateAutomaticEvaluation
