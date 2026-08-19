import { composeSpecializedRubric } from '../src/services/rubricService.js'
import { buildSpecializedEvaluationDraft } from '../src/services/specializedEvaluationWorkflow.js'

const realtimeCharacterMobile = composeSpecializedRubric({
  productionTargetId: 'TARGET_REALTIME',
  assetTypeId: 'character_creature',
  platformProfileId: 'mobile',
})

const animationCharacterFilm = composeSpecializedRubric({
  productionTargetId: 'TARGET_ANIMATION',
  assetTypeId: 'character_creature',
  platformProfileId: 'film-render',
})

if (!realtimeCharacterMobile.ready || !animationCharacterFilm.ready) {
  throw new Error('有效上下文未能组合专项规则。')
}

if (realtimeCharacterMobile.profileId === animationCharacterFilm.profileId) {
  throw new Error('不同生产上下文生成了相同的专项档案。')
}

if (!realtimeCharacterMobile.rules.some((rule) => rule.source === 'UNIVERSAL_REUSED')) {
  throw new Error('专项规则没有复用通用评测结果。')
}

if (realtimeCharacterMobile.rules.length !== new Set(realtimeCharacterMobile.rules.map((rule) => rule.id)).size) {
  throw new Error('专项规则组合中存在重复规则。')
}

const evidenceDraft = buildSpecializedEvaluationDraft({
  context: {
    productionTargetId: 'TARGET_REALTIME',
    assetTypeId: 'prop_hard_surface',
    platformProfileId: 'unspecified',
  },
  geometryAnalysis: {
    meshCount: 1,
    vertexCount: 1200,
    triangleCount: 800,
    materialSlotCount: 1,
    nonManifoldEdgeCount: 0,
    duplicateFaceCount: 0,
    degenerateTriangleCount: 0,
    boundaryEdgeCount: 4,
    nearDegenerateTriangleCount: 2,
    sliverTriangleCount: 3,
    missingNormalMeshCount: 0,
    invalidNormalCount: 0,
    uvMeshCount: 1,
    missingUvMeshCount: 0,
  },
})

if (evidenceDraft.readiness.automaticEvidenceCount !== 4) {
  throw new Error('专项真实几何证据没有正确装配。')
}

if (evidenceDraft.readiness.completedRuleCount !== 0 || evidenceDraft.readiness.isComplete) {
  throw new Error('未确认的几何证据不应被当成正式专项评分。')
}

const performanceEvidence = evidenceDraft.values.RT_PERFORMANCE_BUDGET
if (!performanceEvidence.recommendation.includes('暂不建议评分') || !performanceEvidence.requiredEvidence.includes('先选择')) {
  throw new Error('平台未指定时，没有正确阻止性能预算建议。')
}

console.log(`专项规则组合验证通过：实时移动端 ${realtimeCharacterMobile.rules.length} 条，动画影视 ${animationCharacterFilm.rules.length} 条；4 条真实证据保持待确认。`)
