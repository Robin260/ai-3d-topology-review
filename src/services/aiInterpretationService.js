import { AI_INTERPRETATION_ROLES } from '../config/aiInterpretation.js'
import { getRuleById } from '../config/rule.js'

const sourceLabels = {
  AUTOMATIC_GEOMETRY: '真实几何检测',
  MANUAL_REVIEWER: '人工确认',
  DEMO: '演示数据',
}

function takeIssueNames(result, limit = 3) {
  return (result?.issues || [])
    .slice(0, limit)
    .map((issue) => issue.title || issue.name || getRuleById(issue.ruleId)?.name || issue.ruleId || '未命名问题')
}

function getCoverage(result) {
  const value = result?.evaluatedCoverage
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : '未生成'
}

function getScore(result) {
  const value = result?.overallScore ?? result?.partialScore
  return Number.isFinite(value) ? value.toFixed(1) : '未生成'
}

function getEvidenceSources(result) {
  const sources = new Set((result?.ruleResults || []).map((item) => sourceLabels[item.evaluatedBy] || item.evaluatedBy).filter(Boolean))
  return sources.size ? [...sources].join('、') : '尚无检测证据'
}

export function buildRoleInsights({ result, gateResult, productionContext = {} }) {
  const issues = takeIssueNames(result)
  const issueSummary = issues.length ? issues.join('、') : '当前已测规则未发现明确问题'
  const coverage = getCoverage(result)
  const score = getScore(result)
  const blockerCount = gateResult?.blockerCount ?? 0
  const targetReady = Boolean(productionContext.productionTargetId && productionContext.assetTypeId && productionContext.platformProfileId)

  return {
    algorithm: {
      headline: issues.length ? '先处理高影响失败类型' : '保持检测稳定并扩大覆盖',
      summary: `当前分数 ${score}，重点问题：${issueSummary}。`,
      actions: issues.length
        ? ['按问题类型聚类失败样本', '复核几何规则的误报与漏报', '将修复前后结果加入回归集']
        : ['继续补充边流与变形类检测', '保留当前模型作为通过样本', '监控不同格式解析一致性'],
    },
    data: {
      headline: coverage === '100%' ? '检查证据分布是否均衡' : '优先补齐未覆盖规则',
      summary: `规则覆盖率 ${coverage}；当前证据来源：${getEvidenceSources(result)}。`,
      actions: ['区分真实检测、人工确认和演示数据', '为问题记录区域、严重度与修复结果', '不要把未评测项当作零分样本'],
    },
    market: {
      headline: '只展示用户可以验证的结论',
      summary: issues.length ? `可围绕“定位 ${issues.length} 类问题并给出修复路径”表达价值。` : '当前没有足够问题证据时，不宣传自动修复或全自动交付。',
      actions: ['演示中标注检测覆盖范围', '用前后对比说明节省的返工成本', '避免把局部自动检测描述为完整 AI 审核'],
    },
    product: {
      headline: blockerCount ? `${blockerCount} 项阻断问题优先于总分` : '维持质量分与交付状态分离',
      summary: targetReady ? '生产上下文已具备，可进入专项生产评测。' : '通用结果完成后，还需选择生产目标、资产类型和平台。',
      actions: blockerCount
        ? ['先修复阻断问题', '修复后重新运行门槛检查', '保留原始质量分用于前后比较']
        : ['完成全部通用规则确认', '再进入专项生产评测', '保存结构化结果供 PK 和统计复用'],
    },
  }
}

export function buildChatGptHandoff({
  stage = 'universal',
  modelName,
  modelFormat,
  result,
  gateResult,
  productionContext = {},
}) {
  const compactResult = {
    evaluationStage: stage,
    model: { name: modelName, format: modelFormat || 'unknown' },
    score: result?.overallScore ?? result?.partialScore ?? null,
    grade: result?.grade ?? null,
    confidence: result?.confidence ?? null,
    evaluatedCoverage: result?.evaluatedCoverage ?? null,
    dimensionScores: result?.dimensionScores ?? {},
    issues: (result?.issues || []).map((issue) => ({
      ruleId: issue.ruleId,
      severity: issue.severity,
      title: issue.title || issue.name || null,
      evidence: issue.evidence,
      consequence: issue.consequence,
      suggestion: issue.suggestion,
    })),
    deliveryGate: gateResult ? {
      status: gateResult.deliveryStatus,
      blockerCount: gateResult.blockerCount,
      qualityScoreUnchanged: gateResult.qualityScoreUnchanged,
    } : null,
    productionContext,
  }

  return [
    '你是 AI 3D 拓扑低模评测顾问。请只依据下面的结构化数据进行分析，不要虚构模型外观、动画效果或未检测到的事实。',
    '请分别给算法、数据、市场、产品四类人员输出：1）最重要结论；2）三条可执行建议；3）需要补充的数据。',
    '请明确区分真实检测、人工确认和未评测内容；质量分与是否可交付必须分开解释。',
    '',
    JSON.stringify(compactResult, null, 2),
  ].join('\n')
}

export function getInterpretationRole(roleId) {
  return AI_INTERPRETATION_ROLES.find((role) => role.id === roleId) || AI_INTERPRETATION_ROLES[0]
}
