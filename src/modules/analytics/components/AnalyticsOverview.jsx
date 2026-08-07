import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const gradeColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

function MetricCard({ label, value, note, tone = 'default' }) {
  return <div className={`analytics-metric-card is-${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
}

function AnalyticsOverview({ aggregate }) {
  const { metrics } = aggregate
  return (
    <div className="analytics-overview">
      <section className="analytics-metric-grid">
        <MetricCard label="总评测数量" value={metrics.count} note={`涉及 ${metrics.modelCount} 个模型`} />
        <MetricCard label="平均综合分" value={metrics.averageScore.toFixed(1)} note="只聚合原始快照分数" />
        <MetricCard label="PASS 率" value={`${metrics.passRate.toFixed(0)}%`} note="沿用原评测 PASS 状态" tone="success" />
        <MetricCard label="Production Ready" value={`${metrics.readyRate.toFixed(0)}%`} note="与质量分分开统计" tone="success" />
        <MetricCard label="阻断问题" value={metrics.blockerCount} note={`${metrics.blockedSnapshots} 条评测受影响`} tone={metrics.blockerCount ? 'warning' : 'success'} />
      </section>

      <section className="analytics-chart-grid is-primary-row">
        <article className="analytics-card analytics-trend-card">
          <div className="analytics-card-heading"><div><span>QUALITY TREND</span><h2>模型质量趋势</h2></div><small>按评测时间</small></div>
          <div className="analytics-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregate.trend} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="var(--color-text-tertiary)" />
                <YAxis domain={[50, 100]} tick={{ fontSize: 9 }} stroke="var(--color-text-tertiary)" />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: 'var(--color-border)', fontSize: 10 }} />
                <Line type="monotone" dataKey="score" name="综合分" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--chart-1)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-card analytics-grade-card">
          <div className="analytics-card-heading"><div><span>GRADE DISTRIBUTION</span><h2>质量等级分布</h2></div></div>
          <div className="analytics-grade-layout">
            <div className="analytics-pie-area">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={aggregate.grades} dataKey="value" nameKey="grade" innerRadius={52} outerRadius={76} paddingAngle={3}>{aggregate.grades.map((item, index) => <Cell key={item.grade} fill={gradeColors[index % gradeColors.length]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-grade-legend">{aggregate.grades.map((item, index) => <div key={item.grade}><i style={{ background: gradeColors[index % gradeColors.length] }} /><span>{item.grade} 级</span><strong>{item.value}</strong></div>)}</div>
          </div>
        </article>
      </section>

      <section className="analytics-chart-grid">
        <article className="analytics-card analytics-dimension-card">
          <div className="analytics-card-heading"><div><span>RUBRIC DIMENSIONS</span><h2>通用维度平均得分率</h2></div><small>自动读取当前 Rubric</small></div>
          <div className="analytics-dimension-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregate.dimensions} layout="vertical" margin={{ top: 4, right: 18, left: 30, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} stroke="var(--color-text-tertiary)" />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} stroke="var(--color-text-tertiary)" />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Bar dataKey="average" name="平均得分率" fill="var(--chart-1)" radius={[0, 5, 5, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-card analytics-issues-card">
          <div className="analytics-card-heading"><div><span>TOP ISSUES</span><h2>高频问题</h2></div><small>问题实例 / 影响评测</small></div>
          <div className="analytics-issue-list">
            {aggregate.topIssues.slice(0, 6).map((issue, index) => (
              <div key={issue.code}><span className={issue.blocking ? 'is-blocking' : ''}>{index + 1}</span><div><strong>{issue.title}</strong><small>{issue.code}</small></div><div><strong>{issue.instances}</strong><small>{issue.affectedSnapshots} 条评测</small></div></div>
            ))}
          </div>
        </article>
      </section>

      <section className="analytics-card">
        <div className="analytics-card-heading"><div><span>SOURCE PERFORMANCE</span><h2>模型来源表现</h2></div><small>只描述当前样本，不代表绝对优劣</small></div>
        <div className="analytics-source-grid">
          {aggregate.sources.map((source) => <div key={source.name}><span>{source.name}</span><strong>{source.averageScore.toFixed(1)}</strong><small>{source.count} 条样本 · Ready {source.readyRate.toFixed(0)}% · 阻断 {source.blockers}</small></div>)}
        </div>
      </section>
    </div>
  )
}

export default AnalyticsOverview
