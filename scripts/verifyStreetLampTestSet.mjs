import { readFile } from 'node:fs/promises'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { streetLampTestGroup } from '../src/config/sceneTestModels.js'
import { getModelSource } from '../src/config/productionContext.js'
import { composeSpecializedRubric } from '../src/services/rubricService.js'
import { analyzeMeshGeometry } from '../src/utils/analyzeMeshGeometry.js'

const models = [streetLampTestGroup.baseline, ...streetLampTestGroup.candidates]
const results = []

for (const model of models) {
  const relativePath = `../public${model.url}`
  const buffer = await readFile(new URL(relativePath, import.meta.url))
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  const object = new FBXLoader().parse(arrayBuffer, '')
  const analysis = analyzeMeshGeometry(object)
  if (analysis.meshCount === 0 || analysis.triangleCount === 0) {
    throw new Error(`${model.name} 没有解析到有效网格。`)
  }
  if (!analysis.topologyAnalysisComplete) {
    throw new Error(`${model.name} 没有完成拓扑分析。`)
  }
  results.push({ model, analysis })
}

const baseline = results[0].analysis
if (baseline.nonManifoldEdgeCount !== 0 || baseline.missingUvMeshCount !== 0 || baseline.degenerateTriangleCount !== 0) {
  throw new Error('FIXED 参考模型应保留 UV，且非流形边应为 0。')
}
if (baseline.nearDegenerateTriangleCount === 0) {
  throw new Error('FIXED 参考模型的近退化三角面基线没有被保留。')
}

for (const { model, analysis } of results.slice(1)) {
  if (analysis.missingUvMeshCount === 0) throw new Error(`${model.name} 的当前测试基线应记录 UV 缺失。`)
}

const specializedRubric = composeSpecializedRubric(streetLampTestGroup.specializedPreset)
if (!specializedRubric.ready || specializedRubric.rules.length === 0) {
  throw new Error('路灯专项预设没有生成有效规则组合。')
}
if (!models.every((model) => getModelSource(model.sourceTypeId))) {
  throw new Error('路灯模型来源类型配置无效。')
}

console.log(`路灯真实测试组通过：${results.length} 个 FBX 全部可读取；FIXED ${baseline.triangleCount} 面，AUTO 范围 ${Math.min(...results.slice(1).map(({ analysis }) => analysis.triangleCount))}～${Math.max(...results.slice(1).map(({ analysis }) => analysis.triangleCount))} 面；专项组合 ${specializedRubric.rules.length} 条。`)
