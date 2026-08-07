import assert from 'node:assert/strict'
import { generateAutomaticEvaluation } from '../src/services/automaticEvaluationEngine.js'
import {
  buildUniversalEvaluationDraft,
  createManualRuleResult,
} from '../src/services/universalEvaluationWorkflow.js'

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
  modelName: 'Workflow Diagnostic',
  modelFormat: 'obj',
  evaluationMode: 'LOW_POLY_ONLY',
})

const emptyDraft = buildUniversalEvaluationDraft({ automaticResult, mode: 'LOW_POLY_ONLY' })
assert.equal(emptyDraft.readiness.isComplete, false)
assert.ok(emptyDraft.readiness.lockedAutomaticCount >= 5)
assert.ok(emptyDraft.readiness.missingRuleIds.length > 0)

const manualResults = Object.fromEntries(
  emptyDraft.readiness.missingRuleIds.map((ruleId) => [ruleId, createManualRuleResult(ruleId, 5)]),
)
const completeDraft = buildUniversalEvaluationDraft({ automaticResult, manualResults, mode: 'LOW_POLY_ONLY' })

assert.equal(completeDraft.readiness.isComplete, true)
assert.equal(completeDraft.readiness.coverage, 1)
assert.ok(Number.isFinite(completeDraft.result.overallScore))
assert.ok(completeDraft.result.grade)
assert.equal(completeDraft.values.MH_NON_MANIFOLD.rawScore, automaticResult.ruleResults.find((item) => item.ruleId === 'MH_NON_MANIFOLD').rawScore)
assert.equal(completeDraft.values.MH_NON_MANIFOLD.evaluatedBy, 'LOCAL_GEOMETRY_ENGINE')

console.log(`通用闭环验证通过：${completeDraft.readiness.lockedAutomaticCount} 条自动锁定，${completeDraft.readiness.manualConfirmedCount} 条人工确认，正式得分 ${completeDraft.result.overallScore.toFixed(1)}。`)

