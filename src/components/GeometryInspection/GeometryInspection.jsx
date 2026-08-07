import { EmptyState, ErrorNotice, StatusCard } from '../ui/index.js'
import './GeometryInspection.css'

const formatCount = (value) => new Intl.NumberFormat('zh-CN').format(value || 0)

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const formatDimensions = (dimensions) => {
  if (!dimensions) return '—'
  return `${dimensions.x.toFixed(2)} × ${dimensions.y.toFixed(2)} × ${dimensions.z.toFixed(2)}`
}

function GeometryInspection({ analysis, fileInfo, loading = false, hasError = false }) {
  if (hasError) {
    return (
      <section className="geometry-inspection">
        <ErrorNotice
          title="基础几何预检没有完成"
          message="模型文件没有成功解析，因此不会生成顶点、三角面或法线数据。"
          guidance="请修复文件或重新选择有效的 GLB、GLTF、OBJ 或 FBX。"
        />
      </section>
    )
  }

  if (!analysis) {
    return (
      <EmptyState
        compact
        className="geometry-inspection-empty"
        symbol={loading ? '···' : '△'}
        eyebrow="真实几何预检"
        title={loading ? '正在读取模型结构' : '导入模型后显示真实数据'}
        description={loading ? '正在解析网格对象、顶点、三角面和基础法线信息。' : '这里不会使用演示数字。导入本地模型后，浏览器会在当前会话中读取可可靠获得的基础几何数据。'}
        note="预检不等于完整评分，未实现的规则仍保持未评测"
      />
    )
  }

  const warningCount = analysis.degenerateTriangleCount
    + analysis.sliverTriangleCount
    + analysis.duplicateFaceCount
    + analysis.nonManifoldEdgeCount
    + analysis.missingNormalMeshCount
    + analysis.invalidNormalCount
  const healthy = warningCount === 0
  const metrics = [
    { label: '网格对象', value: formatCount(analysis.meshCount), note: 'Mesh 数量' },
    { label: '缓冲顶点', value: formatCount(analysis.vertexCount), note: '未进行焊接去重' },
    { label: '三角面', value: formatCount(analysis.triangleCount), note: '按加载后网格统计' },
    { label: '文件大小', value: formatFileSize(fileInfo?.size), note: fileInfo?.format?.toUpperCase() || '未知格式' },
    { label: '模型尺寸', value: formatDimensions(analysis.dimensions), note: '文件坐标单位' },
    { label: '退化三角面', value: formatCount(analysis.degenerateTriangleCount), note: '零面积或近零面积' },
    { label: '细长三角面', value: formatCount(analysis.sliverTriangleCount), note: '极端宽高比例' },
    { label: '重复面', value: formatCount(analysis.duplicateFaceCount), note: '完全相同三角面' },
    { label: '非流形边', value: formatCount(analysis.nonManifoldEdgeCount), note: analysis.topologyAnalysisComplete ? '拓扑分析完成' : '超大网格未完整分析' },
    { label: '开放边', value: formatCount(analysis.boundaryEdgeCount), note: '需确认是否为设计开口' },
    { label: '缺少法线网格', value: formatCount(analysis.missingNormalMeshCount), note: '按网格对象统计' },
    { label: '异常法线', value: formatCount(analysis.invalidNormalCount), note: '零长度或非法数值' },
    { label: '缺少 UV 网格', value: formatCount(analysis.missingUvMeshCount), note: '只记录，不在通用层扣分' },
  ]

  return (
    <section className="geometry-inspection">
      <div className="geometry-inspection__heading">
        <div><span className="section-kicker">REAL GEOMETRY PRE-CHECK</span><h2>真实几何预检</h2></div>
        <span className="info-chip">当前浏览器会话</span>
      </div>
      <StatusCard
        tone={healthy ? 'success' : 'warning'}
        label="基础解析结果"
        title={healthy ? '未发现可直接确认的基础异常' : `发现 ${formatCount(warningCount)} 项基础异常计数`}
        description="这里只报告浏览器能够可靠读取的数据，不会推断边流、造型质量或动画适配。"
        meta="真实读取"
      />
      <div className="geometry-metric-grid">
        {metrics.map((metric) => (
          <div className="geometry-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </div>
        ))}
      </div>
      <p className="geometry-inspection__note">
        注意：GLB、GLTF、OBJ 和 FBX 加载后通常会被三角化，无法可靠恢复原始四边面比例；因此本阶段不生成四边面评分，也不生成完整 100 分。
      </p>
    </section>
  )
}

export default GeometryInspection
