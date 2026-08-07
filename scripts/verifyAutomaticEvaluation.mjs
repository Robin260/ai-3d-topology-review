import { generateAutomaticEvaluation } from '../src/services/automaticEvaluationEngine.js'

const baseAnalysis = {
  triangleCount: 1000,
  topologyAnalysisComplete: true,
  nonManifoldEdgeCount: 0,
  nonManifoldVertexCount: 0,
  duplicateFaceCount: 0,
  degenerateTriangleCount: 0,
  sliverTriangleCount: 0,
  minimumTriangleQuality: 0.6,
  boundaryEdgeCount: 0,
  missingNormalMeshCount: 0,
  invalidNormalCount: 0,
}

const cleanResult = generateAutomaticEvaluation({
  analysis: baseAnalysis,
  modelName: 'Clean Test',
  modelFormat: 'obj',
  evaluationMode: 'LOW_POLY_ONLY',
})

if (cleanResult.overallScore !== null || cleanResult.partialScore !== 100) {
  throw new Error('部分自动评测不应伪造正式总分，且干净测试的已测规则表现应为 100。')
}

if (cleanResult.evaluatedCoverage >= 1 || cleanResult.productionReadyBase !== 'NOT_EVALUATED') {
  throw new Error('部分覆盖不应被标记为完整评测或可交付。')
}

const damagedResult = generateAutomaticEvaluation({
  analysis: {
    ...baseAnalysis,
    nonManifoldEdgeCount: 3,
    nonManifoldVertexCount: 4,
    duplicateFaceCount: 2,
    degenerateTriangleCount: 5,
    sliverTriangleCount: 120,
    minimumTriangleQuality: 0,
    boundaryEdgeCount: 18,
  },
  modelName: 'Damaged Test',
  modelFormat: 'obj',
  evaluationMode: 'LOW_POLY_ONLY',
})

if (damagedResult.issues.length < 4) {
  throw new Error('问题模型没有生成足够的可解释问题。')
}

if (!damagedResult.ruleResults.some((item) => item.ruleId === 'MH_HOLES' && item.status === 'REVIEW_REQUIRED')) {
  throw new Error('开放边界应要求人工确认，而不是自动扣分。')
}

console.log(`自动评测验证通过：真实判断 ${cleanResult.evaluatedRuleCount} 条；问题模型生成 ${damagedResult.issues.length} 类问题。`)
