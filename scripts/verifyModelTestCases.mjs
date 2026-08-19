import { readFile } from 'node:fs/promises'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { analyzeMeshGeometry } from '../src/utils/analyzeMeshGeometry.js'
import { generateAutomaticEvaluation } from '../src/services/automaticEvaluationEngine.js'
import { adaptStorageRecord } from '../src/modules/analytics/adapters/evaluationSnapshotAdapter.js'

const loader = new OBJLoader()

const evaluateObj = async (path, name) => {
  const content = await readFile(new URL(path, import.meta.url), 'utf8')
  const object = loader.parse(content)
  const analysis = analyzeMeshGeometry(object)
  return {
    analysis,
    result: generateAutomaticEvaluation({
      analysis,
      modelName: name,
      modelFormat: 'obj',
      evaluationMode: 'LOW_POLY_ONLY',
    }),
  }
}

const clean = await evaluateObj('../public/models/topology-clean-cube.obj', '健康封闭网格')
const diagnostic = await evaluateObj('../public/models/auto-evaluation-diagnostic.obj', '拓扑问题诊断网格')
const openBoundary = await evaluateObj('../public/models/topology-open-boundary.obj', '开放边界测试网格')
const sliver = await evaluateObj('../public/models/topology-sliver-triangle.obj', '狭长三角面测试网格')

if (clean.analysis.nonManifoldEdgeCount !== 0 || clean.analysis.boundaryEdgeCount !== 0 || clean.result.issues.length !== 0) {
  throw new Error('健康模型没有得到预期的无问题结果。')
}

const diagnosticRules = new Set(diagnostic.result.issues.map((issue) => issue.ruleId))
for (const requiredRuleId of ['MH_NON_MANIFOLD', 'MH_DUPLICATE', 'MH_ZERO_AREA']) {
  if (!diagnosticRules.has(requiredRuleId)) throw new Error(`问题模型缺少 ${requiredRuleId} 检测结果。`)
}

if (diagnostic.analysis.issueRegions.nonManifoldEdges.length === 0
  || diagnostic.analysis.issueRegions.duplicateFaces.length === 0
  || diagnostic.analysis.issueRegions.degenerateFaces.length === 0) {
  throw new Error('问题模型没有生成可点击的问题区域证据。')
}

if (openBoundary.analysis.boundaryEdgeCount !== 4 || openBoundary.analysis.issueRegions.boundaryEdges.length !== 4) {
  throw new Error('开放边界测试模型没有得到预期的 4 条可定位边界。')
}

if (sliver.analysis.sliverTriangleCount !== 1 || sliver.analysis.issueRegions.sliverFaces.length !== 1) {
  throw new Error('狭长三角面测试模型没有得到预期的可定位结果。')
}

const partialRecord = {
  id: 'PARTIAL_TEST',
  type: 'single',
  totalScoreA: null,
  universalResult: diagnostic.result,
}
if (adaptStorageRecord(partialRecord) !== null) {
  throw new Error('部分自动结果不应进入 Analytics 正式统计。')
}

console.log(`真实模型测试通过：健康模型 0 问题；诊断模型 ${diagnostic.result.issues.length} 类问题；开放边 ${openBoundary.analysis.boundaryEdgeCount} 条；狭长面 ${sliver.analysis.sliverTriangleCount} 个。`)
