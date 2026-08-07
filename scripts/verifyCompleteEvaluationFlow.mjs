import assert from 'node:assert/strict'
import { generateAutomaticEvaluation } from '../src/services/automaticEvaluationEngine.js'
import {
  buildUniversalEvaluationDraft,
  createManualRuleResult,
} from '../src/services/universalEvaluationWorkflow.js'
import {
  buildSpecializedEvaluationDraft,
  confirmRemainingSpecializedRules,
} from '../src/services/specializedEvaluationWorkflow.js'
import { evaluateDeliveryGates } from '../src/services/deliveryGateEngine.js'

const analysis = {
  triangleCount: 15,
  nonManifoldEdgeCount: 3,
  nonManifoldVertexCount: 3,
  duplicateFaceCount: 1,
  degenerateTriangleCount: 1,
  sliverTriangleCount: 1,
  minimumTriangleQuality: 0,
  boundaryEdgeCount: 2,
  missingNormalMeshCount: 0,
  invalidNormalCount: 0,
  topologyAnalysisComplete: true,
}

const automaticResult = generateAutomaticEvaluation({
  analysis,
  modelName: 'Complete Flow Diagnostic',
  modelFormat: 'obj',
  evaluationMode: 'LOW_POLY_ONLY',
})
const universalDraft = buildUniversalEvaluationDraft({ automaticResult, mode: 'LOW_POLY_ONLY' })
const universalManualResults = Object.fromEntries(
  universalDraft.readiness.missingRuleIds.map((ruleId) => [ruleId, createManualRuleResult(ruleId, 5)]),
)
const universalResult = buildUniversalEvaluationDraft({
  automaticResult,
  manualResults: universalManualResults,
  mode: 'LOW_POLY_ONLY',
}).result

const context = {
  productionTargetId: 'TARGET_REALTIME',
  assetTypeId: 'character_creature',
  platformProfileId: 'mobile',
}
const specializedDraft = buildSpecializedEvaluationDraft({ context, universalResult })
const specializedManualResults = confirmRemainingSpecializedRules(specializedDraft)
const specializedResult = buildSpecializedEvaluationDraft({
  context,
  universalResult,
  manualResults: specializedManualResults,
}).result
const gateResult = evaluateDeliveryGates({ universalResult, specializedResult })

assert.ok(Number.isFinite(universalResult.overallScore))
assert.ok(Number.isFinite(specializedResult.overallScore))
assert.equal(specializedResult.evaluationState, 'COMPLETE_MANUAL_WITH_REUSE')
assert.equal(gateResult.deliveryStatus, 'fix_then_deliver')
assert.equal(gateResult.qualityScoreUnchanged, universalResult.overallScore)
assert.ok(gateResult.blockers.some((item) => item.ruleId === 'MH_NON_MANIFOLD'))
assert.ok(gateResult.blockers.some((item) => item.ruleId === 'MH_ZERO_AREA'))
assert.ok(gateResult.blockers.every((item) => typeof item.reason === 'string'))

console.log(`完整闭环验证通过：通用分 ${universalResult.overallScore.toFixed(1)}，专项分 ${specializedResult.overallScore.toFixed(1)}，交付状态 ${gateResult.deliveryStatus}，阻断问题 ${gateResult.blockerCount} 项。`)
