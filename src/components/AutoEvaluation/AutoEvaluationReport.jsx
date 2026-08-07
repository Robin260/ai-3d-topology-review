import { getRuleById, ruleStatusLabels } from '../../config/rule.js'
import { Button, StatusCard } from '../ui/index.js'
import './AutoEvaluationReport.css'

const statusTone = {
  PASS: 'is-pass',
  WARNING: 'is-warning',
  FAIL: 'is-fail',
  REVIEW_REQUIRED: 'is-review',
}

function AutoEvaluationReport({ result, onSave, saveStatus = 'idle', formalComplete = false }) {
  if (!result) return null

  return (
    <section className="auto-evaluation-report">
      <div className="auto-evaluation-heading">
        <div>
          <span className="section-kicker">EXPLAINABLE LOCAL AUTO EVALUATION</span>
          <h2>本地自动评测结果</h2>
          <p>结果来自浏览器实际读取的网格数据，不调用外部接口，也不会伪造无法检测的美术判断。</p>
        </div>
        <span className="info-chip">真实规则检测 · 部分覆盖</span>
      </div>

      <div className="auto-evaluation-overview">
        <div className="auto-score-card">
          <span>已测规则表现</span>
          <strong>{result.partialScore?.toFixed(1) ?? '—'}<small>/ 100</small></strong>
          <p>这不是完整综合分，也不产生正式等级。</p>
        </div>
        <div className="auto-metric-card"><span>已自动判断</span><strong>{result.evaluatedRuleCount}</strong><small>/ {result.applicableRuleCount} 条适用规则</small></div>
        <div className="auto-metric-card"><span>规则覆盖率</span><strong>{Math.round(result.evaluatedCoverage * 100)}%</strong><small>未检测项不按零分</small></div>
        <div className="auto-metric-card"><span>真实问题</span><strong>{result.issues.length}</strong><small>{result.reviewRequiredCount} 条需要人工确认</small></div>
      </div>

      <StatusCard
        tone={result.issues.length ? 'warning' : 'success'}
        label="自动评测结论"
        title={result.issues.length ? `发现 ${result.issues.length} 类可确认问题` : '已测规则未发现可确认问题'}
        description={result.summary.overallAssessment}
        meta="不替代完整通用评测"
      />

      <div className="auto-rule-grid">
        {result.ruleResults.map((ruleResult) => {
          const rule = getRuleById(ruleResult.ruleId)
          return (
            <article className={statusTone[ruleResult.status] || ''} key={ruleResult.ruleId}>
              <div>
                <span>{rule?.dimensionId || '通用规则'}</span>
                <strong>{rule?.name || ruleResult.ruleId}</strong>
                <p>{ruleResult.reason || Object.entries(ruleResult.evidence).map(([key, value]) => `${key}: ${value}`).join(' · ')}</p>
              </div>
              <div>
                <b>{ruleStatusLabels[ruleResult.status] || ruleResult.status}</b>
                <small>{ruleResult.rawScore === null ? '—' : `${ruleResult.rawScore} / 5`}</small>
              </div>
            </article>
          )
        })}
      </div>

      {result.issues.length > 0 && (
        <div className="auto-issue-list">
          <div className="auto-subheading"><span>AUTO ISSUES</span><h3>问题证据与修复建议</h3></div>
          {result.issues.map((issue, index) => (
            <article key={issue.issueId}>
              <span>{index + 1}</span>
              <div>
                <strong>{getRuleById(issue.ruleId)?.name || issue.ruleId}</strong>
                <p><b>证据：</b>{issue.evidence}</p>
                <p><b>影响：</b>{issue.consequence}</p>
                <p><b>建议：</b>{issue.suggestion}</p>
              </div>
              <em>{issue.severity}</em>
            </article>
          ))}
        </div>
      )}

      <div className="auto-limitations">
        <strong>为什么现在还不给正式等级？</strong>
        <ul>{result.summary.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>

      <div className={`auto-save-result is-${saveStatus}`}>
        <div>
          <strong>{formalComplete ? '部分结果已经升级为正式通用评测' : saveStatus === 'success' ? '本次部分评测已保存' : '确认这次自动评测结果'}</strong>
          <p>{formalComplete ? '无需再单独保存部分记录；正式结果保留了原始自动证据和人工确认来源。' : saveStatus === 'success' ? '结构化结果已经写入本地记录；模型文件本体没有保存。' : '保存后可作为待完善记录继续补充。未获得正式总分前，不会进入 Analytics 正式统计。'}</p>
        </div>
        <Button disabled={formalComplete || saveStatus === 'success'} variant={formalComplete || saveStatus === 'success' ? 'secondary' : 'primary'} onClick={onSave}>
          {formalComplete ? '无需保存部分结果' : saveStatus === 'success' ? '已保存' : saveStatus === 'error' ? '重试保存' : '确认并保存记录'}
        </Button>
      </div>
    </section>
  )
}

export default AutoEvaluationReport
