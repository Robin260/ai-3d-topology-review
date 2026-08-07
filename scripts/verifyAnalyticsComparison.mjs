import { analyticsMockSnapshots } from '../src/modules/analytics/data/analyticsMock.js'
import {
  getDefaultVersionComparison,
  getLaterVersionSnapshots,
  getVersionBaselineSnapshots,
} from '../src/modules/analytics/services/analyticsQueryService.js'

const defaults = getDefaultVersionComparison(analyticsMockSnapshots)
const left = analyticsMockSnapshots.find((item) => item.snapshotId === defaults.left)
const right = analyticsMockSnapshots.find((item) => item.snapshotId === defaults.right)

if (left?.modelId !== 'CHAR_A' || left.modelVersion !== 'v1.0') {
  throw new Error('默认基准不是 Character A 的最早版本 v1.0。')
}

if (right?.modelId !== 'CHAR_A' || right.modelVersion !== 'v1.2') {
  throw new Error('默认目标不是 Character A 的最新版本 v1.2。')
}

const rightCandidates = getLaterVersionSnapshots(analyticsMockSnapshots, left.snapshotId)
if (rightCandidates.some((item) => item.modelId !== left.modelId || item.snapshotId === left.snapshotId)) {
  throw new Error('右侧候选包含了其他模型或基准版本自身。')
}

const baselineIds = new Set(getVersionBaselineSnapshots(analyticsMockSnapshots).map((item) => item.snapshotId))
if (baselineIds.has('SNAP_011')) {
  throw new Error('只有一个版本的 Vehicle D 不应出现在版本基准候选中。')
}

console.log('Analytics 版本链验证通过：Character A v1.0 → v1.2；不同模型与单版本模型已排除。')
