import { buildLiveGeometryComparison } from '../src/services/liveGeometryComparison.js'

const modelA = {
  triangleCount: 1200,
  vertexCount: 700,
  meshCount: 1,
  materialSlotCount: 1,
  nonManifoldEdgeCount: 0,
  boundaryEdgeCount: 0,
  duplicateFaceCount: 0,
  degenerateTriangleCount: 0,
  sliverTriangleCount: 0,
  invalidNormalCount: 0,
  missingNormalMeshCount: 0,
  missingUvMeshCount: 0,
  issueRegions: {},
}

const modelB = {
  ...modelA,
  triangleCount: 1500,
  vertexCount: 820,
  nonManifoldEdgeCount: 3,
  duplicateFaceCount: 2,
  issueRegions: {
    nonManifoldEdges: [{ center: [0, 0, 0] }],
    duplicateFaces: [{ center: [0, 0, 0] }, { center: [1, 0, 0] }],
  },
}

const result = buildLiveGeometryComparison(modelA, modelB)
const triangles = result.metrics.find((metric) => metric.id === 'triangleCount')
const nonManifold = result.metrics.find((metric) => metric.id === 'nonManifoldEdgeCount')

if (triangles.delta !== 300) throw new Error('三角面精确差值错误。')
if (nonManifold.delta !== 3 || nonManifold.advantage !== 'A') throw new Error('非流形差值或优势判断错误。')
if (nonManifold.regionCountB !== 1) throw new Error('问题区域数量没有进入 PK 结果。')
if (result.recommendation !== 'A' || result.healthB.status !== 'BLOCKED') throw new Error('技术健康建议错误。')
if ('overallScore' in result || 'score' in result) throw new Error('实时几何 PK 不应伪造综合质量分。')
if (buildLiveGeometryComparison(modelA, null).healthB.status !== 'NOT_EVALUATED') throw new Error('缺失模型必须保持未评测。')

const bothBlocked = buildLiveGeometryComparison(
  { ...modelA, nonManifoldEdgeCount: 1 },
  { ...modelB, nonManifoldEdgeCount: 2 },
)
if (bothBlocked.recommendation !== 'HOLD') throw new Error('双方都有阻断问题时不应强行判胜负。')

const scaleMismatch = buildLiveGeometryComparison(
  { ...modelA, dimensions: { x: 1, y: 2, z: 1 } },
  { ...modelA, dimensions: { x: 1, y: 3, z: 1 } },
)
if (scaleMismatch.fairness.status !== 'NEEDS_CONFIRMATION' || scaleMismatch.recommendation !== 'HOLD') {
  throw new Error('尺寸差异较大时必须暂停胜负判断。')
}

console.log('实时几何 PK 测试通过：精确差值、问题定位、阻断优先和未评测状态均正确。')
