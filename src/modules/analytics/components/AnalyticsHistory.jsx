import { Link } from 'react-router-dom'
import { Button, EmptyState } from '../../../components/ui/index.js'

const formatDate = (value) => new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))

const winnerLabel = (winner) => ({ A: '模型 A', B: '模型 B', tie: '持平', undetermined: '待人工复核' })[winner] || '待人工复核'

function AnalyticsHistory({ snapshots, comparisons, sortBy, onSortChange }) {
  return (
    <div className="analytics-history-stack">
      <section className="analytics-card analytics-history-card">
        <div className="analytics-card-heading">
          <div><span>SINGLE MODEL EVALUATIONS</span><h2>单模型评测记录</h2></div>
          <label className="analytics-inline-select"><span>排序</span><select value={sortBy} onChange={(event) => onSortChange(event.target.value)}><option value="latest">最新评测</option><option value="score_desc">分数从高到低</option><option value="score_asc">分数从低到高</option><option value="name">模型名称</option></select></label>
        </div>
        {snapshots.length === 0 ? <EmptyState compact title="当前没有单模型正式记录" description="完成一次通用评测后，它会出现在这里。" /> : <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead><tr><th>模型与版本</th><th>生产目标</th><th>综合分</th><th>等级</th><th>Ready</th><th>阻断</th><th>评测时间</th><th>操作</th></tr></thead>
            <tbody>{snapshots.map((snapshot) => <tr key={snapshot.snapshotId}><td><strong>{snapshot.modelName}</strong><small>{snapshot.modelVersion} · {snapshot.snapshotId}</small></td><td><span>{snapshot.evaluationContext.productionTargetName}</span><small>{snapshot.evaluationContext.assetTypeName}</small></td><td><strong>{snapshot.result.totalScore.toFixed(1)}</strong></td><td>{snapshot.result.grade}</td><td><span className={snapshot.result.productionReady ? 'analytics-state is-ready' : 'analytics-state is-not-ready'}>{snapshot.result.productionReady ? '可交付' : '暂不可交付'}</span></td><td>{snapshot.result.blockingIssueCount}</td><td>{formatDate(snapshot.evaluatedAt)}</td><td><Button as={Link} size="small" variant="secondary" to={`/evaluate/universal?resume=${encodeURIComponent(snapshot.snapshotId)}`}>查看</Button></td></tr>)}</tbody>
          </table>
        </div>}
      </section>

      <section className="analytics-card analytics-pk-history-card">
        <div className="analytics-card-heading"><div><span>SAVED COMPARISONS</span><h2>模型 PK 记录</h2></div><small>PK 不参与单模型平均分和趋势统计</small></div>
        {comparisons.length === 0 ? <EmptyState compact title="还没有保存 PK 结果" description="在模型 PK 页面选择两份真实历史评测并保存后，记录会出现在这里。" /> : <div className="analytics-pk-records">
          {comparisons.map((stored) => {
            const comparison = stored.comparisonResult
            return <article key={stored.id}>
              <span className="analytics-record-type">PK</span>
              <div className="analytics-pk-models"><strong>{stored.modelA?.name || '模型 A'} <i>vs</i> {stored.modelB?.name || '模型 B'}</strong><small>{comparison.productionTarget} · {formatDate(stored.updatedAt)}</small></div>
              <div className="analytics-pk-scores"><span>{Number(stored.totalScoreA).toFixed(1)}</span><i>:</i><span>{Number(stored.totalScoreB).toFixed(1)}</span></div>
              <div className="analytics-pk-winner"><small>综合结论</small><strong>{winnerLabel(stored.winner)}</strong></div>
              <Button as={Link} size="small" variant="secondary" to={`/pk?record=${encodeURIComponent(stored.id)}`}>查看 PK</Button>
            </article>
          })}
        </div>}
      </section>
    </div>
  )
}

export default AnalyticsHistory
