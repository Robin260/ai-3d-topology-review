import assert from 'node:assert/strict'
import { createComparisonInputFromRecords, getComparableEvaluationRecords } from '../src/services/comparisonRecordAdapter.js'

const makeRecord = (id, score, updatedAt, modelId = 'SOURCE_1') => ({
  id,
  type: 'single',
  updatedAt,
  modelA: { modelId, name: `Model ${id}`, format: 'GLB' },
  rubricVersion: 'UNIVERSAL_RETOPO_V1',
  universalResult: {
    evaluationId: `EVAL_${id}`,
    overallScore: score,
    evaluatedCoverage: 0.9,
    dimensionScores: { MESH_HEALTH: { score: 18 } },
    model: {},
  },
  productionContext: { productionTargetId: 'game', standardProfileId: 'character' },
  gateResult: { blockers: [] },
})

const older = makeRecord('A', 80, '2026-08-01T00:00:00.000Z')
const newer = makeRecord('B', 90, '2026-08-02T00:00:00.000Z')
const incomplete = { id: 'C', type: 'single', universalResult: null }
const comparable = getComparableEvaluationRecords([older, incomplete, newer])
assert.deepEqual(comparable.map((record) => record.id), ['B', 'A'])

const input = createComparisonInputFromRecords(older, newer)
assert.equal(input.modelA.overallScore, 80)
assert.equal(input.modelB.overallScore, 90)
assert.equal(input.fairnessContext.sameSource, true)
assert.equal(input.fairnessContext.sameScale, undefined)
assert.ok(input.missingEvidence.includes('尺寸与单位'))
assert.equal(input.metadata.source, 'local_records')
assert.throws(() => createComparisonInputFromRecords(older, older), /comparison_records_must_differ/)

console.log('Comparison record adapter verified.')

