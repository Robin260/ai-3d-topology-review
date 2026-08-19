const finding = (id, tone, title, value, conclusion, action) => ({
  id,
  tone,
  title,
  value,
  conclusion,
  action,
  evidenceType: '浏览器真实几何检测',
})

export function buildSpecializedGeometryEvidence(analysis, context = {}) {
  if (!analysis) return []

  const findings = []
  const blockerCount = analysis.nonManifoldEdgeCount
    + analysis.duplicateFaceCount
    + analysis.degenerateTriangleCount
  const topologyCoverageComplete = analysis.topologySkippedTriangleCount === 0

  findings.push(finding(
    'GEOMETRY_SCALE',
    'info',
    '模型规模',
    `${analysis.triangleCount.toLocaleString('zh-CN')} tris`,
    topologyCoverageComplete
      ? `已完成全部 ${analysis.topologyAnalyzedTriangleCount.toLocaleString('zh-CN')} 个三角面的拓扑扫描。`
      : `有 ${analysis.topologySkippedTriangleCount.toLocaleString('zh-CN')} 个三角面因规模限制未进入拓扑扫描。`,
    context.platformProfileId === 'unspecified'
      ? '先确认移动端、PC、主机或 Web 平台，再判断该面数是否超出预算。'
      : '结合当前平台预算确认面数、材质槽和 LOD 是否合格。',
  ))

  findings.push(finding(
    'MESH_BLOCKERS',
    blockerCount > 0 ? 'error' : 'success',
    '核心网格健康',
    blockerCount > 0 ? `${blockerCount} 项核心异常` : '未发现核心异常',
    `非流形边 ${analysis.nonManifoldEdgeCount}、重复面 ${analysis.duplicateFaceCount}、真正零面积面 ${analysis.degenerateTriangleCount}。`,
    blockerCount > 0
      ? '优先在 DCC 中定位并修复这些异常，再重新导入复测。'
      : '当前自动检测未发现这三类阻断风险；仍需完成专项人工检查。',
  ))

  const shapeReviewCount = analysis.boundaryEdgeCount
    + analysis.nearDegenerateTriangleCount
    + analysis.sliverTriangleCount
  findings.push(finding(
    'SHAPE_REVIEW',
    shapeReviewCount > 0 ? 'warning' : 'success',
    '结构复核信号',
    `${shapeReviewCount} 处待查`,
    `开放边界 ${analysis.boundaryEdgeCount}、近退化面 ${analysis.nearDegenerateTriangleCount}、狭长三角面 ${analysis.sliverTriangleCount}。开放边界不等于一定错误。`,
    shapeReviewCount > 0
      ? '打开 Overlay 定位问题；结合路灯的真实结构判断哪些是合理开口，哪些需要修复。'
      : '未发现需要复核的开放边界、近退化面或狭长三角面。',
  ))

  const uvComplete = analysis.meshCount > 0 && analysis.missingUvMeshCount === 0
  findings.push(finding(
    'UV_PRESENCE',
    uvComplete ? 'success' : 'warning',
    'UV 数据存在性',
    uvComplete ? '所有网格含 UV' : `${analysis.missingUvMeshCount}/${analysis.meshCount} 个网格缺少 UV`,
    uvComplete
      ? '已检测到 UV 通道，但浏览器暂不能证明拉伸、重叠和利用率合格。'
      : '缺少 UV 的网格无法直接进入常规贴图与烘焙流程。',
    uvComplete
      ? '继续在 DCC 中检查 UV 重叠、拉伸、Padding 和纹理密度。'
      : '先补齐 UV，再执行烘焙和专项 UV 质量检查。',
  ))

  const normalIssueCount = analysis.missingNormalMeshCount + analysis.invalidNormalCount
  findings.push(finding(
    'NORMAL_HEALTH',
    normalIssueCount > 0 ? 'warning' : 'success',
    '基础法线数据',
    normalIssueCount > 0 ? `${normalIssueCount} 项异常` : '基础数据可读取',
    `缺失法线网格 ${analysis.missingNormalMeshCount}、无效法线 ${analysis.invalidNormalCount}。这不代表引擎中的高光表现已经合格。`,
    normalIssueCount > 0
      ? '重新计算或修复法线，并在目标引擎中检查硬边和切线空间。'
      : '在目标引擎中继续确认硬边、平滑组、加权法线与烘焙结果。',
  ))

  return findings
}
