import { useState } from 'react'
import ModelViewer from '../ModelViewer/ModelViewer.jsx'
import { StatusCard } from '../ui/index.js'
import { comparisonLabels } from '../../config/comparison/comparisonConfig.js'
import './ComparisonDashboard.css'

const winnerName = (winner) => comparisonLabels.winner[winner] || winner

function ModelResultHeader({ side, model, delivery }) {
  const tone = delivery === 'blocked' || delivery === 'not_ready' ? 'error' : delivery === 'ready' ? 'success' : 'warning'
  return (
    <div className="pk-model-header">
      <div><span>模型 {side}</span><strong>{model.model.name}</strong></div>
      <div className={`pk-delivery-badge is-${tone}`}><span>{Number(model.overallScore).toFixed(1)}</span><small>{comparisonLabels.delivery[delivery]}</small></div>
    </div>
  )
}

function WinnerCard({ label, winner, note }) {
  return (
    <div className="pk-winner-card">
      <span>{label}</span>
      <strong>{winnerName(winner)}</strong>
      <small>{note}</small>
    </div>
  )
}

function blockerDescription(blockers) {
  if (!blockers.length) return '当前记录没有硬性门槛阻断问题。'
  if (blockers.length === 1) return blockers[0].title
  return `存在 ${blockers.length} 项阻断问题，首要问题：${blockers[0].title}`
}

function ComparisonDashboard({ record }) {
  const [viewerMode, setViewerMode] = useState('solid')
  const [activeRole, setActiveRole] = useState(record.roleFeedback[0]?.id)
  const activeFeedback = record.roleFeedback.find((item) => item.id === activeRole)
  const fairnessTone = record.fairness.status === 'valid' ? 'success' : record.fairness.status === 'invalid' ? 'error' : 'warning'
  const confidenceTone = record.confidence.level === 'high' ? 'success' : record.confidence.level === 'medium' ? 'warning' : 'error'
  const isMock = record.metadata.source === 'mock'

  const renderViewer = (model) => model.model.previewSource || isMock
    ? <ModelViewer source={model.model.previewSource} format={model.model.fileFormat} modelName={model.model.name} mode={viewerMode} onModeChange={setViewerMode} />
    : <div className="pk-preview-unavailable"><strong>评测结果可比较</strong><p>本地上传文件不会被保存在浏览器中，因此此处无法恢复三维模型。重新上传模型后可再次预览，但不会影响本次分数 PK。</p></div>

  return (
    <div className="pk-dashboard">
      <section className="pk-context-panel">
        <div><span>生产目标</span><strong>{record.productionTarget}</strong></div>
        <div><span>专项标准</span><strong>{record.standardProfileId}</strong></div>
        <div><span>评测版本</span><strong>{record.evaluationVersion}</strong></div>
        <StatusCard compact tone={fairnessTone} label="公平性" title={comparisonLabels.fairness[record.fairness.status]} meta={`${record.fairness.passedCount}/${record.fairness.totalCount} 项通过`} />
        <StatusCard compact tone={confidenceTone} label="PK 置信度" title={`${record.confidence.score} · ${comparisonLabels.confidence[record.confidence.level]}`} meta="证据覆盖" />
      </section>

      <section className="pk-viewer-section">
        <div className="pk-section-heading">
          <div><span className="section-kicker">SIDE-BY-SIDE VIEW</span><h2>双模型视图</h2></div>
          <span className="info-chip">显示模式已同步 · 相机同步待接入</span>
        </div>
        <div className="pk-viewer-grid">
          <div className="pk-model-view">
            <ModelResultHeader side="A" model={record.modelA} delivery={record.delivery.A} />
            {renderViewer(record.modelA)}
          </div>
          <div className="pk-model-view">
            <ModelResultHeader side="B" model={record.modelB} delivery={record.delivery.B} />
            {renderViewer(record.modelB)}
          </div>
        </div>
      </section>

      <section className="pk-verdict-panel">
        <div className="pk-verdict-main">
          <span className="section-kicker">CURRENT RECOMMENDATION</span>
          <h2>当前推荐：{winnerName(record.winners.deliveryRecommendation)}</h2>
          <p>{record.recommendation.rationale}</p>
          <div className="pk-verdict-tags"><span>质量与交付分开</span><span>阻断问题优先</span><span>{isMock ? '演示结论' : '历史结果比较'}</span></div>
        </div>
        <div className="pk-winner-grid">
          <WinnerCard label="综合推荐" winner={record.winners.overallWinner} note="结合风险与当前目标" />
          <WinnerCard label="质量表现" winner={record.winners.qualityWinner} note={`总分差 ${Math.abs(record.totalDelta).toFixed(1)}`} />
          <WinnerCard label="资源效率" winner={record.winners.performanceWinner} note="仅比较当前三角面消耗" />
          <WinnerCard label="风险控制" winner={record.winners.riskWinner} note="阻断问题优先" />
        </div>
      </section>

      <section className="pk-comparison-panel">
        <div className="pk-section-heading">
          <div><span className="section-kicker">DIMENSION DIFFERENCES</span><h2>通用维度差异</h2></div>
          <span className="info-chip">复用单模型结果</span>
        </div>
        <div className="pk-comparison-table" role="table" aria-label="模型维度差异">
          <div className="pk-comparison-row is-header" role="row"><span>模型 A</span><span>评测维度</span><span>模型 B</span><span>结论</span></div>
          {record.dimensions.map((item) => (
            <div className="pk-comparison-row" role="row" key={item.dimensionId}>
              <div className="pk-score-side is-a"><strong>{item.modelA?.toFixed(1)}</strong><span><i style={{ width: `${item.normalizedA || 0}%` }} /></span></div>
              <div className="pk-dimension-name"><strong>{item.label}</strong><small>权重 {item.weight}</small></div>
              <div className="pk-score-side is-b"><strong>{item.modelB?.toFixed(1)}</strong><span><i style={{ width: `${item.normalizedB || 0}%` }} /></span></div>
              <div className={`pk-difference-badge winner-${String(item.winner).toLowerCase()}`}><strong>{winnerName(item.winner)}</strong><small>{comparisonLabels.difference[item.differenceLevel]}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section className="pk-risk-grid">
        <div className="pk-risk-panel">
          <div className="pk-section-heading"><div><span className="section-kicker">BLOCKING GATES</span><h2>阻断与交付</h2></div></div>
          <div className="pk-blocker-grid">
            <StatusCard
              tone={record.blockingIssues.A.length ? 'error' : 'success'}
              label="模型 A"
              title={comparisonLabels.delivery[record.delivery.A]}
              description={blockerDescription(record.blockingIssues.A)}
              meta={record.blockingIssues.A[0]?.region}
            />
            <StatusCard
              tone={record.blockingIssues.B.length ? 'error' : 'success'}
              label="模型 B"
              title={comparisonLabels.delivery[record.delivery.B]}
              description={blockerDescription(record.blockingIssues.B)}
              meta={record.blockingIssues.B[0]?.region}
            />
          </div>
          {(record.blockingIssues.A[0] || record.blockingIssues.B[0]) && <p className="pk-release-condition"><strong>解除条件：</strong>{record.blockingIssues.A[0]?.releaseCondition || record.blockingIssues.B[0]?.releaseCondition}</p>}
        </div>

        <div className="pk-role-panel">
          <div className="pk-section-heading"><div><span className="section-kicker">ROLE FEEDBACK</span><h2>岗位行动建议</h2></div></div>
          <div className="pk-role-tabs" role="tablist" aria-label="岗位建议">
            {record.roleFeedback.map((item) => (
              <button className={activeRole === item.id ? 'is-active' : ''} key={item.id} type="button" role="tab" aria-selected={activeRole === item.id} onClick={() => setActiveRole(item.id)}>{item.name}</button>
            ))}
          </div>
          {activeFeedback && <div className="pk-role-content"><span>关注：{activeFeedback.focus}</span><p>{activeFeedback.message}</p></div>}
        </div>
      </section>

      <section className="boundary-note">
        <span className="boundary-icon">i</span>
        <div><strong>{isMock ? '当前 PK 使用结构化演示数据' : '当前 PK 使用本机历史评测记录'}</strong><p>{isMock ? '公平性、差异、置信度和阻断优先逻辑由真实纯函数运行；模型分数与问题用于展示完整页面结构。' : '分数、维度、阻断问题与交付状态均来自已保存评测；无法从历史记录证明的公平性条件会标为未知并降低置信度，不会伪装成已通过。'}</p></div>
      </section>
    </div>
  )
}

export default ComparisonDashboard

