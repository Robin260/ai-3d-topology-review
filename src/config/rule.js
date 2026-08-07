import rubricConfig from './rubrics/universal/rubric.json' with { type: 'json' }
import rulesConfig from './rubrics/universal/rules.json' with { type: 'json' }
import exampleResultConfig from './rubrics/universal/example-result.json' with { type: 'json' }

export const RUBRIC_VERSION = rubricConfig.rubricId
export const GRADE_VERSION = 'UNIVERSAL_GRADE_V1'
export const SCORE_RANGE = Object.freeze({ min: 0, max: 100 })
export const RULE_SCORE_RANGE = Object.freeze({ min: 0, max: 5 })

export const AUTOMATIC_EVALUATION_VERSION = 'LOCAL_AUTO_EVALUATION_V1'
export const automaticEvaluationPolicy = Object.freeze({
  completeCoverageMinimum: 0.75,
  rules: {
    MH_NON_MANIFOLD: {
      metric: 'nonManifoldEdgeRatio',
      bands: [
        { max: 0, score: 5 },
        { max: 0.00002, score: 4 },
        { max: 0.0001, score: 3 },
        { max: 0.0005, score: 2 },
        { max: 0.002, score: 1 },
        { max: 1, score: 0 },
      ],
    },
    MH_DUPLICATE: {
      metric: 'duplicateFaceRatio',
      bands: [
        { max: 0, score: 5 },
        { max: 0.00002, score: 4 },
        { max: 0.0001, score: 3 },
        { max: 0.0005, score: 2 },
        { max: 0.002, score: 1 },
        { max: 1, score: 0 },
      ],
    },
    MH_ZERO_AREA: {
      metric: 'degenerateTriangleRatio',
      bands: [
        { max: 0, score: 5 },
        { max: 0.0001, score: 4 },
        { max: 0.001, score: 3 },
        { max: 0.005, score: 2 },
        { max: 0.02, score: 1 },
        { max: 1, score: 0 },
      ],
    },
    MH_DEGENERATE: {
      metric: 'sliverTriangleRatio',
      bands: [
        { max: 0, score: 5 },
        { max: 0.001, score: 4 },
        { max: 0.01, score: 3 },
        { max: 0.03, score: 2 },
        { max: 0.08, score: 1 },
        { max: 1, score: 0 },
      ],
    },
    DE_ASPECT_RATIO: {
      metric: 'sliverTriangleRatio',
      bands: [
        { max: 0, score: 5 },
        { max: 0.001, score: 4 },
        { max: 0.01, score: 3 },
        { max: 0.03, score: 2 },
        { max: 0.08, score: 1 },
        { max: 1, score: 0 },
      ],
    },
  },
})

export const universalRubric = Object.freeze(rubricConfig)
export const universalRules = Object.freeze(rulesConfig.rules)
export const universalExampleResult = Object.freeze(exampleResultConfig)
export const evaluateRubric = universalRubric

const gradeNames = {
  S: '优秀',
  A: '良好',
  B: '基本可用',
  C: '基础及格',
  D: '需大量修复',
  E: '结构不合格',
}

export const scoreGrades = Object.freeze(
  universalRubric.gradeRules.map((grade) => ({
    id: grade.grade,
    name: gradeNames[grade.grade],
    min: grade.minimumScore,
    max: grade.maximumScore,
    description: grade.description,
  })),
)

export const detectionTypeLabels = Object.freeze({
  AUTOMATIC: '自动检测',
  AI_VISUAL: 'AI 视觉',
  HYBRID: '混合判断',
  MANUAL_REVIEW: '人工复核',
})

export const ruleStatusLabels = Object.freeze({
  PASS: '通过',
  WARNING: '警告',
  FAIL: '失败',
  REVIEW_REQUIRED: '待复核',
  NOT_EVALUATED: '未评测',
  NOT_APPLICABLE: '不适用',
})

export const universalGateLabels = Object.freeze({
  PASS: '基础通过',
  CONDITIONAL_PASS: '有条件通过',
  FAIL: '未通过',
  NOT_EVALUATED: '等待评测',
})

export const deliveryStatuses = Object.freeze([
  { id: 'deliverable', name: '可交付' },
  { id: 'fix_then_deliver', name: '修复后可交付' },
  { id: 'do_not_proceed', name: '不建议进入下一阶段' },
])

export const unassessedGrade = Object.freeze({
  id: 'NOT_EVALUATED',
  name: '未评测',
  description: '当前缺少有效规则结果，不能计算通用质量等级。',
  guidance: '请完成可适用规则的检测；缺少参考模型时，对比类规则应标记为未评测而不是零分。',
})

const toFiniteNumber = (value, fallback) => {
  if (value === '' || value === null || value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeScore(value, range = RULE_SCORE_RANGE) {
  const min = toFiniteNumber(range.min ?? range.minimum, RULE_SCORE_RANGE.min)
  const max = toFiniteNumber(range.max ?? range.maximum, RULE_SCORE_RANGE.max)
  const safeMax = max > min ? max : min
  const fallback = toFiniteNumber(range.defaultValue, min)
  const numericValue = toFiniteNumber(value, fallback)
  return Math.min(Math.max(numericValue, min), safeMax)
}

export function getRuleById(ruleId) {
  return universalRules.find((rule) => rule.id === ruleId) || null
}

export function getDimensionById(dimensionId) {
  return universalRubric.dimensions.find((dimension) => dimension.id === dimensionId) || null
}

export function getDimensionRules(dimensionId, mode = 'REFERENCE_COMPARISON') {
  const dimension = getDimensionById(dimensionId)
  if (!dimension) return []
  return dimension.ruleIds
    .map(getRuleById)
    .filter((rule) => rule && rule.applicableModes.includes(mode))
}

export function validateRubric(rubric = universalRubric, rules = universalRules) {
  const errors = []
  const dimensions = Array.isArray(rubric?.dimensions) ? rubric.dimensions : []
  const ruleIds = new Set(rules.map((rule) => rule.id))
  const dimensionIds = new Set()

  if (!rubric?.rubricId) errors.push('缺少 rubricId。')
  if (dimensions.length === 0) errors.push('通用标准至少需要一个维度。')

  dimensions.forEach((dimension) => {
    if (dimensionIds.has(dimension.id)) errors.push(`维度 ID 重复：${dimension.id}。`)
    dimensionIds.add(dimension.id)
    if (!Number.isFinite(Number(dimension.weight)) || Number(dimension.weight) <= 0) {
      errors.push(`维度 ${dimension.id} 的权重无效。`)
    }
    dimension.ruleIds.forEach((ruleId) => {
      if (!ruleIds.has(ruleId)) errors.push(`维度 ${dimension.id} 引用了不存在的规则 ${ruleId}。`)
    })
  })

  const weightTotal = dimensions.reduce((sum, dimension) => sum + Number(dimension.weight || 0), 0)
  if (weightTotal !== Number(rubric?.totalWeight)) {
    errors.push(`维度权重总和为 ${weightTotal}，应为 ${rubric?.totalWeight ?? 100}。`)
  }

  return { valid: errors.length === 0, errors, weightTotal, ruleCount: rules.length }
}

const readRuleValue = (entry) => {
  if (entry === '' || entry === null || entry === undefined) return null
  if (typeof entry === 'object') {
    if (['NOT_EVALUATED', 'NOT_APPLICABLE', 'REVIEW_REQUIRED'].includes(entry.status)) return null
    return Number.isFinite(Number(entry.rawScore)) ? Number(entry.rawScore) : null
  }
  return Number.isFinite(Number(entry)) ? Number(entry) : null
}

export function calcUniversalEvaluation(values = {}, mode = 'REFERENCE_COMPARISON') {
  const applicableRules = universalRules.filter((rule) => rule.applicableModes.includes(mode))
  const applicableIds = new Set(applicableRules.map((rule) => rule.id))
  let evaluatedRuleCount = 0
  let completedRuleCount = 0
  let notApplicableRuleCount = 0

  const dimensionScores = Object.fromEntries(universalRubric.dimensions.map((dimension) => {
    const dimensionRuleIds = dimension.ruleIds.filter((ruleId) => applicableIds.has(ruleId))
    const resolvedEntries = dimensionRuleIds.map((ruleId) => values[ruleId])
    const dimensionNotApplicableCount = resolvedEntries.filter((entry) => entry?.status === 'NOT_APPLICABLE').length
    const scores = dimensionRuleIds
      .map((ruleId) => readRuleValue(values[ruleId]))
      .filter((score) => score !== null)
      .map((score) => normalizeScore(score, RULE_SCORE_RANGE))

    evaluatedRuleCount += scores.length
    notApplicableRuleCount += dimensionNotApplicableCount
    completedRuleCount += scores.length + dimensionNotApplicableCount
    const score = scores.length === 0
      ? null
      : dimension.weight * scores.reduce((sum, value) => sum + value, 0) / (scores.length * RULE_SCORE_RANGE.max)

    return [dimension.id, {
      score: score === null ? null : normalizeScore(score, { min: 0, max: dimension.weight }),
      maximum: dimension.weight,
      coverage: dimensionRuleIds.length ? (scores.length + dimensionNotApplicableCount) / dimensionRuleIds.length : 1,
      evaluatedRuleCount: scores.length,
      notApplicableRuleCount: dimensionNotApplicableCount,
      applicableRuleCount: dimensionRuleIds.length,
    }]
  }))

  const evaluatedDimensions = Object.values(dimensionScores).filter((dimension) => dimension.score !== null)
  const totalScore = evaluatedDimensions.length === 0
    ? null
    : evaluatedDimensions.reduce((sum, dimension) => sum + dimension.score, 0)
  const missingDimensionIds = universalRubric.dimensions
    .filter((dimension) => dimension.ruleIds.some((ruleId) => applicableIds.has(ruleId)))
    .filter((dimension) => dimensionScores[dimension.id].evaluatedRuleCount === 0)
    .map((dimension) => dimension.id)
  const isComplete = completedRuleCount === applicableRules.length && missingDimensionIds.length === 0

  return {
    totalScore: totalScore === null ? null : normalizeScore(totalScore, SCORE_RANGE),
    formalScore: isComplete && totalScore !== null ? normalizeScore(totalScore, SCORE_RANGE) : null,
    dimensionScores,
    coverage: applicableRules.length ? completedRuleCount / applicableRules.length : 0,
    evaluatedRuleCount,
    completedRuleCount,
    notApplicableRuleCount,
    applicableRuleCount: applicableRules.length,
    missingDimensionIds,
    isComplete,
  }
}

export function calcTotalScore(values = {}, rubricOrMode = universalRubric) {
  const mode = typeof rubricOrMode === 'string' ? rubricOrMode : 'REFERENCE_COMPARISON'
  return calcUniversalEvaluation(values, mode).totalScore
}

export function getScoreGrade(score) {
  if (score === '' || score === null || score === undefined || !Number.isFinite(Number(score))) {
    return unassessedGrade
  }
  const normalized = normalizeScore(score, SCORE_RANGE)
  return scoreGrades.find((grade) => normalized >= grade.min) || scoreGrades[scoreGrades.length - 1]
}
