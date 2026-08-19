import { getRuleById } from '../config/rule.js'

const universalGatePolicies = [
  { ruleId: 'MH_NON_MANIFOLD', maximumPassingScore: 4.999, title: '存在非流形几何', severity: 'CRITICAL', releaseCondition: '修复所有非流形边和异常多面连接后重新检测。' },
  { ruleId: 'MH_ZERO_AREA', maximumPassingScore: 4.999, title: '存在零面积几何', severity: 'CRITICAL', releaseCondition: '删除零面积面并清理重合顶点后重新检测。' },
  { ruleId: 'MH_NORMAL_DIRECTION', maximumPassingScore: 1, title: '法线存在严重异常', severity: 'CRITICAL', releaseCondition: '统一并修复法线方向后重新检测。' },
  { ruleId: 'MH_HOLES', maximumPassingScore: 1, title: '存在严重非设计性破洞', severity: 'CRITICAL', releaseCondition: '确认开口设计意图并修复非设计性破洞。' },
]

const specializedGatePolicies = [
  { ruleId: 'ENG_WATERTIGHT', maximumPassingScore: 2, title: '模型不满足可制造封闭性', severity: 'CRITICAL', releaseCondition: '修复模型为可切片的封闭实体。' },
  { ruleId: 'ANIM_DEFORMATION_TEST', maximumPassingScore: 1, title: '基础变形测试失败', severity: 'CRITICAL', releaseCondition: '修复关键关节布线并重新完成基础变形测试。' },
  { ruleId: 'RT_PERFORMANCE_BUDGET', maximumPassingScore: 1, title: '超过实时性能绝对预算', severity: 'CRITICAL', releaseCondition: '降低几何成本或重新确认目标平台预算。' },
  { ruleId: 'RT_UV_BAKE', maximumPassingScore: 0, title: 'UV或烘焙流程不可用', severity: 'CRITICAL', releaseCondition: '修复UV与烘焙问题后重新验证。' },
]

const readResults = (result) => Object.fromEntries((result?.ruleResults || []).map((item) => [item.ruleId, item]))

const evidenceLabels = {
  nonManifoldEdgeCount: '非流形边',
  nonManifoldVertexCount: '非流形顶点',
  zeroAreaFaceCount: '零面积面',
  zeroAreaFaceRatio: '零面积面占比',
  openBoundaryEdgeCount: '开放边',
  missingNormalMeshCount: '缺失法线的网格',
  invalidNormalCount: '异常法线',
}

const formatEvidence = (evidence, fallback) => {
  if (typeof evidence === 'string' && evidence.trim()) return evidence
  if (evidence && typeof evidence === 'object') {
    return Object.entries(evidence)
      .map(([key, value]) => `${evidenceLabels[key] || key}：${value}`)
      .join('；')
  }
  return fallback
}

const collectBlockers = (policies, values, source) => policies.flatMap((policy) => {
  const result = values[policy.ruleId]
  if (!result || !Number.isFinite(result.rawScore) || result.rawScore > policy.maximumPassingScore) return []
  const rule = getRuleById(policy.ruleId)
  return [{
    id: `BLOCKER_${policy.ruleId}`,
    ruleId: policy.ruleId,
    title: policy.title,
    severity: policy.severity,
    source,
    reason: formatEvidence(result.evidence, `${rule?.name || policy.ruleId}未达到最低准入要求。`),
    releaseCondition: policy.releaseCondition,
    scoreAtDetection: result.rawScore,
  }]
})

export function evaluateDeliveryGates({ universalResult, specializedResult }) {
  const hasUniversalBaseline = universalResult?.overallScore !== null && universalResult?.overallScore !== undefined
  const universalValues = readResults(universalResult)
  const specializedValues = readResults(specializedResult)
  const blockers = [
    ...collectBlockers(universalGatePolicies, universalValues, 'UNIVERSAL'),
    ...collectBlockers(specializedGatePolicies, specializedValues, 'SPECIALIZED'),
  ]
  const criticalCount = blockers.filter((item) => item.severity === 'CRITICAL').length
  const deliveryStatus = hasUniversalBaseline
    ? blockers.length === 0
      ? 'deliverable'
      : criticalCount >= 3
        ? 'do_not_proceed'
        : 'fix_then_deliver'
    : blockers.length === 0
      ? 'specialized_pass'
      : criticalCount >= 3
        ? 'specialized_do_not_proceed'
        : 'specialized_fix'

  return {
    schemaVersion: '1.0.0',
    gateVersion: 'DELIVERY_GATE_V1',
    passed: blockers.length === 0,
    deliveryStatus,
    blockerCount: blockers.length,
    blockers,
    qualityScoreUnchanged: universalResult?.overallScore ?? specializedResult?.overallScore ?? null,
    evaluationScope: hasUniversalBaseline ? 'FULL' : 'SPECIALIZED_ONLY',
    universalGateEvaluated: hasUniversalBaseline,
    evaluatedAt: new Date().toISOString(),
  }
}

export const deliveryStatusCopy = Object.freeze({
  deliverable: { name: '可交付', tone: 'success', description: '当前硬性门槛均已通过，可以进入下一生产阶段。' },
  fix_then_deliver: { name: '修复后可交付', tone: 'warning', description: '整体质量分保留，但必须先修复阻断问题。' },
  do_not_proceed: { name: '不建议进入下一阶段', tone: 'error', description: '存在多个严重阻断问题，建议先返修基础结构。' },
  specialized_pass: { name: '专项通过 · 通用待评测', tone: 'info', description: '专项规则已通过；通用基础未评测，因此暂不形成完整交付结论。' },
  specialized_fix: { name: '专项修复后通过', tone: 'warning', description: '专项存在阻断问题；修复后可重新检查，通用基础仍待评测。' },
  specialized_do_not_proceed: { name: '专项不建议继续', tone: 'error', description: '专项存在多个严重问题，建议先返修；通用基础仍待评测。' },
})
