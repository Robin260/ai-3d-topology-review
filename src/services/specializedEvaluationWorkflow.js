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

const createGeometryEvidence = (ruleId, evidence, recommendation, requiredEvidence, confidence = 'HIGH') => ({
  ruleId,
  status: 'EVIDENCE_READY',
  rawScore: null,
  normalizedScore: null,
  confidence,
  evidence,
  recommendation,
  requiredEvidence,
  evaluatedBy: 'LOCAL_GEOMETRY_EVIDENCE',
  implementationStatus: 'REAL_EVIDENCE_REQUIRES_CONFIRMATION',
})

export function buildSpecializedAutomaticEvidence(analysis, context = {}) {
  if (!analysis) return {}

  const blockerCount = analysis.nonManifoldEdgeCount
    + analysis.duplicateFaceCount
    + analysis.degenerateTriangleCount
  const reviewCount = analysis.boundaryEdgeCount
    + analysis.nearDegenerateTriangleCount
    + analysis.sliverTriangleCount
  const normalIssueCount = analysis.missingNormalMeshCount + analysis.invalidNormalCount

  return {
    UNIVERSAL_MESH_HEALTH: createGeometryEvidence(
      'UNIVERSAL_MESH_HEALTH',
      `真实扫描：非流形边 ${analysis.nonManifoldEdgeCount}、重复面 ${analysis.duplicateFaceCount}、真正零面积面 ${analysis.degenerateTriangleCount}；另有 ${reviewCount} 处结构复核信号。核心异常合计 ${blockerCount} 项。`,
      blockerCount > 0
        ? '建议先按“严重问题”处理，修复核心异常后再评分。'
        : reviewCount > 0
          ? '核心异常已通过；建议查看 Overlay 后，在“可用”与“良好”之间确认。'
          : '当前自动范围未发现异常，可结合模型视觉检查确认“良好”或“通过”。',
      reviewCount > 0 ? '需要确认开放边界是否符合造型意图，并抽查近退化面和狭长面。' : '仍需检查浏览器暂不支持的极点、N-Gon 与语义边流。',
    ),
    UNIVERSAL_NORMAL_BASE: createGeometryEvidence(
      'UNIVERSAL_NORMAL_BASE',
      `真实扫描：缺失法线网格 ${analysis.missingNormalMeshCount}、无效法线 ${analysis.invalidNormalCount}。基础异常合计 ${normalIssueCount} 项；引擎高光和切线空间仍需人工确认。`,
      normalIssueCount > 0
        ? '建议先判为“明显问题”，修复法线数据后重新检查。'
        : '基础法线数据通过；建议完成引擎预览后再确认“良好”或“通过”。',
      '需要目标引擎截图或旋转灯光检查，确认硬边、平滑组和高光连续性。',
    ),
    RT_PERFORMANCE_BUDGET: createGeometryEvidence(
      'RT_PERFORMANCE_BUDGET',
      `真实读取：${analysis.triangleCount.toLocaleString('zh-CN')} tris、${analysis.vertexCount.toLocaleString('zh-CN')} 顶点、${analysis.materialSlotCount} 个材质槽。是否超出预算取决于目标平台。`,
      context.platformProfileId === 'unspecified'
        ? '暂不建议评分：还没有选择目标平台。'
        : '数据已经准备好；需要与项目自己的平台预算表对照后评分。',
      context.platformProfileId === 'unspecified' ? '先选择移动端、PC、主机、Web、VR 或 AR。' : '需要项目允许的单资产面数、材质槽和 Draw Call 上限。',
    ),
    RT_UV_BAKE: createGeometryEvidence(
      'RT_UV_BAKE',
      `真实读取：${analysis.uvMeshCount}/${analysis.meshCount} 个网格含 UV，${analysis.missingUvMeshCount} 个网格缺少 UV。UV 拉伸、重叠、Padding 和烘焙质量仍需人工确认。`,
      analysis.missingUvMeshCount > 0
        ? '存在网格缺少 UV，建议先判为“明显问题”并补齐。'
        : 'UV 通道齐全，但不能仅凭“存在”判高分；建议检查后再评分。',
      '需要 UV 编辑器截图或检测数据：重叠、拉伸、Padding、纹理密度和烘焙结果。',
    ),
  }
}

export function buildSpecializedEvaluationDraft({ context, universalResult, manualResults = {}, geometryAnalysis = null }) {
  const rubric = composeSpecializedRubric(context)
  if (!rubric.ready) {
    return { rubric, values: {}, readiness: null, result: null }
  }

  const hasUniversalBaseline = universalResult?.overallScore !== null && universalResult?.overallScore !== undefined
  const automaticEvidence = buildSpecializedAutomaticEvidence(geometryAnalysis, context)
  const values = Object.fromEntries(rubric.rules.map((rule) => [
    rule.id,
    rule.source === 'UNIVERSAL_REUSED'
      ? createReusedResult(rule, universalResult) || manualResults[rule.id] || automaticEvidence[rule.id] || null
      : manualResults[rule.id] || automaticEvidence[rule.id] || null,
  ]))
  const missingRuleIds = rubric.rules.map((rule) => rule.id).filter((ruleId) => !hasResolvedValue(values[ruleId]))
  const resolvedResults = Object.values(values).filter(hasResolvedValue)
  const scoredResults = resolvedResults.filter((result) => Number.isFinite(result.rawScore))
  const manualRuleResults = scoredResults.filter((result) => result.evaluatedBy === 'MANUAL_REVIEWER')
  const reusedRuleResults = scoredResults.filter((result) => result.evaluatedBy === 'UNIVERSAL_RESULT_REUSE')
  const automaticEvidenceCount = Object.values(values).filter((result) => result?.evaluatedBy === 'LOCAL_GEOMETRY_EVIDENCE').length
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
      automaticEvidenceCount,
      missingRuleIds,
      hasUniversalBaseline,
      evaluationScope: hasUniversalBaseline ? 'FULL_WITH_UNIVERSAL_REUSE' : 'SPECIALIZED_ONLY',
    },
    result: {
      schemaVersion: '1.0.0',
      evaluationId: `SPECIALIZED_${Date.now()}`,
      rubricVersion: rubric.rubricVersion,
      profileId: rubric.profileId,
      evaluationState: isComplete
        ? hasUniversalBaseline ? 'COMPLETE_MANUAL_WITH_REUSE' : 'COMPLETE_SPECIALIZED_ONLY'
        : hasUniversalBaseline ? 'DRAFT_MANUAL_WITH_REUSE' : 'DRAFT_SPECIALIZED_ONLY',
      overallScore: isComplete ? Number(score.toFixed(1)) : null,
      partialScore: score === null ? null : Number(score.toFixed(1)),
      grade: isComplete ? grade.id : null,
      gradeName: isComplete ? grade.name : null,
      confidence: hasUniversalBaseline ? 'MEDIUM' : 'LOW',
      scoringMethod: 'EQUAL_WEIGHT_PER_COMPOSED_RULE_V1',
      evaluationScope: hasUniversalBaseline ? 'FULL_WITH_UNIVERSAL_REUSE' : 'SPECIALIZED_ONLY',
      universalBaselineIncluded: hasUniversalBaseline,
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
