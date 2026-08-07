import { Link } from 'react-router-dom'
import { Button, EmptyState } from '../../../components/ui/index.js'

const formatDate = (value) => {
  if (!value) return '时间未知'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function AnalyticsPendingEvaluations({ records }) {
  if (records.length === 0) {
    return (
      <EmptyState
        compact
        symbol="✓"
        eyebrow="待完善记录"
        title="当前没有未完成的评测"
        description="保存部分自动评测后，它会出现在这里；正式完成后则进入历史记录和统计分析。"
        actions={<Button as={Link} to="/evaluate">开始一次模型评测</Button>}
      />
    )
  }

  return (
    <div className="analytics-pending">
      <section className="analytics-pending-heading">
        <div><span>PENDING EVALUATIONS</span><h2>{records.length} 条评测等待完善</h2><p>这里是工作草稿箱，不参与平均分、版本趋势、Ready 率和正式报告。</p></div>
        <strong>{records.length}</strong>
      </section>
      <div className="analytics-pending-list">
        {records.map((record) => {
          const result = record.universalResult || {}
          const model = record.modelA || result.model || {}
          const reference = record.modelReference || {}
          const canRestoreModel = reference.sourceType === 'BUILT_IN' && Boolean(reference.url)
          return (
            <article key={record.id}>
              <div className="pending-model-symbol">{canRestoreModel ? '3D' : 'FILE'}</div>
              <div className="pending-model-info">
                <span>{canRestoreModel ? '内置模型可直接恢复' : '本地模型需重新选择文件'}</span>
                <strong>{model.name || '未命名模型'}</strong>
                <p>{model.sourceLabel || model.sourceType || '未标注来源'} · {String(model.format || result.model?.fileFormat || '未知格式').toUpperCase()}</p>
                <small>保存于 {formatDate(record.updatedAt)} · 记录 ID：{record.id.slice(0, 8)}</small>
              </div>
              <div className="pending-metrics">
                <div><span>已测规则表现</span><strong>{result.partialScore?.toFixed?.(1) ?? '—'}</strong></div>
                <div><span>覆盖率</span><strong>{Number.isFinite(result.evaluatedCoverage) ? `${Math.round(result.evaluatedCoverage * 100)}%` : '—'}</strong></div>
                <div><span>问题</span><strong>{result.issues?.length ?? 0}</strong></div>
              </div>
              <div className="pending-action">
                <Button as={Link} size="small" to={`/evaluate?resume=${encodeURIComponent(record.id)}`}>
                  {canRestoreModel ? '恢复模型并继续' : '重新选择文件继续'}
                </Button>
                <small>{canRestoreModel ? '模型 URL 与结构化结果可恢复' : '浏览器不会保存本地模型文件本体'}</small>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default AnalyticsPendingEvaluations
