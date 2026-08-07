import assert from 'node:assert/strict'
import { comparisonMockInput } from '../src/data/comparisonMock.js'
import { buildComparisonRecord } from '../src/services/comparisonService.js'

const clone = (value) => JSON.parse(JSON.stringify(value))

const blockerPriorityRecord = buildComparisonRecord(clone(comparisonMockInput))
assert.equal(blockerPriorityRecord.winners.qualityWinner, 'B', '模型 B 应是质量分胜者')
assert.equal(blockerPriorityRecord.winners.overallWinner, 'A', '模型 B 有阻断问题时应推荐模型 A')
assert.equal(blockerPriorityRecord.delivery.B, 'blocked', '阻断问题必须改变交付状态')

const invalidFairnessInput = clone(comparisonMockInput)
invalidFairnessInput.fairnessContext.sameSource = false
const invalidFairnessRecord = buildComparisonRecord(invalidFairnessInput)
assert.equal(invalidFairnessRecord.fairness.status, 'invalid', '同源检查失败时公平性应无效')
assert.equal(invalidFairnessRecord.winners.overallWinner, 'undetermined', '公平性无效时不得判胜负')

const tieInput = clone(comparisonMockInput)
tieInput.modelB.overallScore = 85.8
tieInput.blockersB = []
tieInput.modelB.issues = []
const tieRecord = buildComparisonRecord(tieInput)
assert.equal(tieRecord.winners.qualityWinner, 'tie', '总分差小于2分时应判为持平')
assert.equal(tieRecord.winners.overallWinner, 'tie', '无阻断且质量持平时不应强行判胜负')

assert.equal(blockerPriorityRecord.roleFeedback.length, 4, '应动态生成四类岗位建议')

console.log('Comparison verification passed: fairness, tie, blocker priority, role feedback.')
