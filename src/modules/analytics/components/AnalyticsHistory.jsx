function AnalyticsHistory({ snapshots, sortBy, onSortChange }) {
  return (
    <section className="analytics-card analytics-history-card">
      <div className="analytics-card-heading">
        <div><span>EVALUATION SNAPSHOTS</span><h2>历史评测记录</h2></div>
        <label className="analytics-inline-select"><span>排序</span><select value={sortBy} onChange={(event) => onSortChange(event.target.value)}><option value="latest">最新评测</option><option value="score_desc">分数从高到低</option><option value="score_asc">分数从低到高</option><option value="name">模型名称</option></select></label>
      </div>
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead><tr><th>模型与版本</th><th>来源</th><th>生产目标</th><th>综合分</th><th>等级</th><th>Ready</th><th>阻断</th><th>评测时间</th></tr></thead>
          <tbody>{snapshots.map((snapshot) => <tr key={snapshot.snapshotId}><td><strong>{snapshot.modelName}</strong><small>{snapshot.modelVersion} · {snapshot.snapshotId}</small></td><td>{snapshot.source.generatorName}</td><td><span>{snapshot.evaluationContext.productionTargetName}</span><small>{snapshot.evaluationContext.assetTypeName}</small></td><td><strong>{snapshot.result.totalScore.toFixed(1)}</strong></td><td>{snapshot.result.grade}</td><td><span className={snapshot.result.productionReady ? 'analytics-state is-ready' : 'analytics-state is-not-ready'}>{snapshot.result.productionReady ? '可交付' : '暂不可交付'}</span></td><td>{snapshot.result.blockingIssueCount}</td><td>{new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(snapshot.evaluatedAt))}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  )
}

export default AnalyticsHistory
