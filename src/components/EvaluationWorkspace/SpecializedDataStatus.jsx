import { buildSpecializedGeometryEvidence } from '../../services/specializedGeometryEvidence.js'
import './SpecializedDataStatus.css'

function Metric({ label, value, meta, tone = 'neutral' }) {
  return <div className={`specialized-data-metric is-${tone}`}><span>{label}</span><strong>{value}</strong><small>{meta}</small></div>
}

function SpecializedDataStatus({ analysis, draft, hasUniversalBaseline }) {
  const readiness = draft?.readiness
  const findings = buildSpecializedGeometryEvidence(analysis, draft?.rubric?.context)
  const blockerIssueCount = analysis
    ? analysis.nonManifoldEdgeCount + analysis.duplicateFaceCount + analysis.degenerateTriangleCount
    : null
  const reviewIssueCount = analysis
    ? analysis.boundaryEdgeCount + analysis.nearDegenerateTriangleCount + analysis.sliverTriangleCount
    : null
  return (
    <section className="specialized-data-status" aria-label="专项评测数据状态">
      <div className="specialized-data-status__heading">
        <div><span>DATA READINESS</span><strong>专项评测当前掌握的数据</strong></div>
        <small>真实检测、复用证据和人工确认分开显示</small>
      </div>
      <div className="specialized-data-status__grid">
        <Metric label="模型规模" value={analysis ? `${analysis.triangleCount.toLocaleString('zh-CN')} tris` : '未读取'} meta={analysis ? `${analysis.vertexCount.toLocaleString('zh-CN')} 顶点 · 浏览器真实解析` : '导入模型后生成'} tone={analysis ? 'info' : 'neutral'} />
        <Metric label="网格健康证据" value={blockerIssueCount === null ? '未检测' : `${blockerIssueCount} 核心 · ${reviewIssueCount} 待查`} meta={analysis ? `非流形 ${analysis.nonManifoldEdgeCount} · 真零面积 ${analysis.degenerateTriangleCount} · 近退化 ${analysis.nearDegenerateTriangleCount}` : '不会使用演示数据'} tone={blockerIssueCount > 0 || reviewIssueCount > 0 ? 'warning' : analysis ? 'success' : 'neutral'} />
        <Metric label="通用证据复用" value={hasUniversalBaseline ? `${readiness?.reusedRuleCount || 0} 条` : '0 条'} meta={hasUniversalBaseline ? '只复用已经完成的正式结果' : '通用基础未评测'} tone={hasUniversalBaseline ? 'success' : 'neutral'} />
        <Metric label="专项规则进度" value={readiness ? `${readiness.manualConfirmedCount}/${readiness.applicableRuleCount}` : '等待生产选择'} meta={readiness ? `${readiness.automaticEvidenceCount || 0} 条已有真实证据 · ${readiness.missingRuleIds.length} 条待确认` : '选择目标、资产和平台后生成规则'} tone={readiness?.isComplete ? 'success' : 'warning'} />
      </div>
      {findings.length > 0 && (
        <div className="specialized-findings" aria-label="真实检测结论">
          <div className="specialized-findings__title">
            <div><span>REAL FINDINGS</span><strong>真实检测结论与下一步</strong></div>
            <small>这些结论不等于专项评分</small>
          </div>
          <div className="specialized-findings__list">
            {findings.map((item) => (
              <article className={`specialized-finding is-${item.tone}`} key={item.id}>
                <div className="specialized-finding__headline">
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                </div>
                <p>{item.conclusion}</p>
                <div><b>下一步</b><span>{item.action}</span></div>
                <small>{item.evidenceType}</small>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default SpecializedDataStatus
