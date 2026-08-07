import { EmptyState, StatusCard } from '../../../components/ui/index.js'

function SnapshotSelect({ label, value, snapshots, onChange }) {
  return <label className="analytics-snapshot-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{snapshots.map((snapshot) => <option value={snapshot.snapshotId} key={snapshot.snapshotId}>{snapshot.modelName} · {snapshot.modelVersion} · {snapshot.result.totalScore}</option>)}</select></label>
}

function AnalyticsCompare({ leftSnapshots, rightSnapshots, leftId, rightId, onLeftChange, onRightChange, comparison }) {
  if (!comparison) return (
    <EmptyState
      compact
      symbol="↗"
      eyebrow="版本对比"
      title="当前筛选范围内没有完整的版本链"
      description="版本分析至少需要同一个模型保存两个不同时间的评测结果。只有一个版本的模型不会与自己比较，也不会与其他模型强行比较。"
      note="不同模型方案请前往“模型 PK”页面"
    />
  )
  return (
    <div className="analytics-compare">
      <section className="analytics-version-scope">
        <div><span>VERSION EVOLUTION</span><strong>只比较同一个模型的时间变化</strong></div>
        <p><b>{comparison.left.modelName}</b><small>{comparison.left.modelId}</small><em>{comparison.left.modelVersion} → {comparison.right.modelVersion}</em></p>
        <span>不同模型之间的方案优劣由 PK Engine 负责</span>
      </section>
      <section className="analytics-card analytics-compare-selectors">
        <SnapshotSelect label="较早或基准版本" value={leftId} snapshots={leftSnapshots} onChange={onLeftChange} />
        <span>→</span>
        <SnapshotSelect label="同一模型的较新版本" value={rightId} snapshots={rightSnapshots} onChange={onRightChange} />
      </section>
      {!comparison.comparable && <StatusCard tone="warning" label="Rubric 可比性" title="两个结果不能直接视为完全可比" description="分数变化可能同时受到模型变化和评分标准变化影响。" />}
      <section className="analytics-compare-summary">
        <div><span>综合分变化</span><strong>{comparison.left.result.totalScore.toFixed(1)} → {comparison.right.result.totalScore.toFixed(1)}</strong><small>{comparison.scoreDelta >= 0 ? '+' : ''}{comparison.scoreDelta.toFixed(1)} · {comparison.changeLabel}</small></div>
        <div><span>Ready 状态</span><strong>{comparison.left.result.productionReady ? '是' : '否'} → {comparison.right.result.productionReady ? '是' : '否'}</strong><small>读取原始快照状态</small></div>
        <div><span>阻断问题</span><strong>{comparison.left.result.blockingIssueCount} → {comparison.right.result.blockingIssueCount}</strong><small>变化 {comparison.right.result.blockingIssueCount - comparison.left.result.blockingIssueCount}</small></div>
        <div><span>问题变化</span><strong>{comparison.resolved.length} 已解决</strong><small>{comparison.added.length} 新增 · {comparison.continuing.length} 持续</small></div>
      </section>
      <section className="analytics-card">
        <div className="analytics-card-heading"><div><span>DIMENSION CHANGE</span><h2>维度得分率变化</h2></div></div>
        <div className="analytics-change-list">{comparison.dimensions.map((dimension) => <div key={dimension.id}><strong>{dimension.name}</strong><span>{dimension.before?.toFixed(1) ?? '—'}%</span><i>→</i><span>{dimension.after.toFixed(1)}%</span><b className={dimension.delta >= 0 ? 'is-positive' : 'is-negative'}>{dimension.delta >= 0 ? '+' : ''}{dimension.delta?.toFixed(1) ?? '—'}</b></div>)}</div>
      </section>
    </div>
  )
}

export default AnalyticsCompare
