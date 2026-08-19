const metricDefinitions = Object.freeze([
  { id: 'triangleCount', label: '三角面', unit: ' tris', direction: 'context' },
  { id: 'vertexCount', label: '顶点', unit: '', direction: 'context' },
  { id: 'meshCount', label: '网格对象', unit: '', direction: 'context' },
  { id: 'materialSlotCount', label: '材质槽', unit: '', direction: 'context' },
  { id: 'dimensionX', label: '包围盒尺寸 X', unit: '', direction: 'context', path: ['dimensions', 'x'], precision: 3 },
  { id: 'dimensionY', label: '包围盒尺寸 Y', unit: '', direction: 'context', path: ['dimensions', 'y'], precision: 3 },
  { id: 'dimensionZ', label: '包围盒尺寸 Z', unit: '', direction: 'context', path: ['dimensions', 'z'], precision: 3 },
  { id: 'nonManifoldEdgeCount', label: '非流形边', unit: '', direction: 'lower', overlayId: 'nonManifold', regionType: 'nonManifoldEdges', severity: 'blocker' },
  { id: 'boundaryEdgeCount', label: '开放边界', unit: '', direction: 'lower', overlayId: 'boundaries', regionType: 'boundaryEdges', severity: 'review' },
  { id: 'duplicateFaceCount', label: '重复面', unit: '', direction: 'lower', overlayId: 'duplicateFaces', regionType: 'duplicateFaces', severity: 'error' },
  { id: 'degenerateTriangleCount', label: '真正零面积面', unit: '', direction: 'lower', overlayId: 'degenerateFaces', regionType: 'degenerateFaces', severity: 'blocker' },
  { id: 'nearDegenerateTriangleCount', label: '近退化三角面', unit: '', direction: 'lower', overlayId: 'nearDegenerateFaces', regionType: 'nearDegenerateFaces', severity: 'review' },
  { id: 'sliverTriangleCount', label: '狭长三角面', unit: '', direction: 'lower', overlayId: 'sliverFaces', regionType: 'sliverFaces', severity: 'review' },
  { id: 'invalidNormalCount', label: '无效法线', unit: '', direction: 'lower', overlayId: 'normals', regionType: 'invalidNormals', severity: 'error' },
  { id: 'missingNormalMeshCount', label: '缺少法线的网格', unit: '', direction: 'lower', overlayId: 'normals', severity: 'review' },
  { id: 'missingUvMeshCount', label: '缺少 UV 的网格', unit: '', direction: 'lower', severity: 'review' },
])

const readNumber = (analysis, field) => {
  const value = analysis?.[field]
  return Number.isFinite(value) ? value : null
}

const readMetricNumber = (analysis, definition) => {
  const value = definition.path
    ? definition.path.reduce((current, key) => current?.[key], analysis)
    : analysis?.[definition.id]
  return Number.isFinite(value) ? value : null
}

const summarizeHealth = (analysis) => {
  if (!analysis) return { status: 'NOT_EVALUATED', label: '未评测', blockerCount: null, issueCount: null }
  const blockerCount = readNumber(analysis, 'nonManifoldEdgeCount')
    + readNumber(analysis, 'degenerateTriangleCount')
  const issueCount = [
    'nonManifoldEdgeCount',
    'boundaryEdgeCount',
    'duplicateFaceCount',
    'degenerateTriangleCount',
    'nearDegenerateTriangleCount',
    'sliverTriangleCount',
    'invalidNormalCount',
    'missingNormalMeshCount',
    'missingUvMeshCount',
  ].reduce((total, field) => total + (readNumber(analysis, field) || 0), 0)

  if (blockerCount > 0) return { status: 'BLOCKED', label: '发现阻断型几何问题', blockerCount, issueCount }
  if (issueCount > 0) return { status: 'REVIEW_REQUIRED', label: '存在需要检查的问题', blockerCount, issueCount }
  return { status: 'MEASURED_HEALTHY', label: '已测技术项未发现问题', blockerCount, issueCount }
}

const evaluateFairness = (analysisA, analysisB) => {
  if (!analysisA || !analysisB) return { status: 'NOT_CHECKED', label: '等待两个模型', maximumDimensionRatio: null }
  const ratios = ['x', 'y', 'z'].map((axis) => {
    const valueA = analysisA.dimensions?.[axis]
    const valueB = analysisB.dimensions?.[axis]
    if (!Number.isFinite(valueA) || !Number.isFinite(valueB) || valueA <= 0 || valueB <= 0) return 1
    return Math.max(valueA, valueB) / Math.min(valueA, valueB)
  })
  const maximumDimensionRatio = Math.max(...ratios)
  if (maximumDimensionRatio > 1.2) {
    return {
      status: 'NEEDS_CONFIRMATION',
      label: '尺寸差异较大，暂不判胜负',
      maximumDimensionRatio,
      reason: `两个模型的包围盒轴向尺寸最大相差 ${((maximumDimensionRatio - 1) * 100).toFixed(1)}%，请确认导出单位、缩放和模型完整范围一致。`,
    }
  }
  return { status: 'COMPARABLE', label: '基础尺寸可比', maximumDimensionRatio, reason: '两个模型的包围盒尺寸处于可比范围。' }
}

export const buildLiveGeometryComparison = (analysisA, analysisB) => {
  const healthA = summarizeHealth(analysisA)
  const healthB = summarizeHealth(analysisB)
  const fairness = evaluateFairness(analysisA, analysisB)
  const metrics = metricDefinitions.map((definition) => {
    const valueA = readMetricNumber(analysisA, definition)
    const valueB = readMetricNumber(analysisB, definition)
    const delta = valueA === null || valueB === null ? null : valueB - valueA
    let advantage = 'NONE'
    if (definition.direction === 'lower' && delta !== 0 && delta !== null) advantage = delta > 0 ? 'A' : 'B'
    return {
      ...definition,
      valueA,
      valueB,
      delta,
      advantage,
      regionCountA: definition.regionType ? analysisA?.issueRegions?.[definition.regionType]?.length || 0 : 0,
      regionCountB: definition.regionType ? analysisB?.issueRegions?.[definition.regionType]?.length || 0 : 0,
    }
  })

  let recommendation = 'HOLD'
  let reason = '当前已测技术项接近，不能仅凭这些数据判定整体拓扑质量胜负。'
  if (fairness.status === 'NEEDS_CONFIRMATION') {
    recommendation = 'HOLD'
    reason = fairness.reason
  } else if (analysisA && analysisB && healthA.blockerCount > 0 && healthB.blockerCount > 0) {
    recommendation = 'HOLD'
    reason = '两个模型都触发了阻断型几何问题；应先定位和确认问题，再讨论哪个版本更适合生产。'
  } else if (analysisA && analysisB && healthA.blockerCount !== healthB.blockerCount) {
    recommendation = healthA.blockerCount < healthB.blockerCount ? 'A' : 'B'
    reason = `模型 ${recommendation} 的阻断型几何问题更少。`
  } else if (analysisA && analysisB && healthA.issueCount !== healthB.issueCount) {
    recommendation = healthA.issueCount < healthB.issueCount ? 'A' : 'B'
    reason = `模型 ${recommendation} 在当前可自动检测的技术项中问题更少。`
  }

  return {
    engineVersion: 'LIVE_GEOMETRY_COMPARISON_V1',
    dataSource: '浏览器本地实时解析',
    generatedAt: new Date().toISOString(),
    healthA,
    healthB,
    fairness,
    metrics,
    recommendation,
    reason,
    limitations: '不包含轮廓还原、动画变形、语义边流、UV 拉伸和艺术质量判断；这些项目保持未评测。',
  }
}

export const getLiveComparisonMetricDefinitions = () => metricDefinitions

export default buildLiveGeometryComparison
