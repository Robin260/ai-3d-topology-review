import { createManualRuleResult } from '../../services/universalEvaluationWorkflow.js'
import { deliveryStatusCopy } from '../../services/deliveryGateEngine.js'
import { Button, StatusCard } from '../ui/index.js'
import './SpecializedEvaluationPanel.css'

const resultSourceLabel = {
  UNIVERSAL_RESULT_REUSE: '通用结果复用',
  MANUAL_REVIEWER: '人工确认',
  LOCAL_GEOMETRY_EVIDENCE: '真实检测证据 · 待确认',
}

function SpecializedEvaluationPanel({
  draft,
  active,
  manualResults,
  onChange,
  finalResult,
  gateResult,
  onFinalize,
  onSave,
  saveStatus = 'idle',
}) {
  if (!draft?.rubric?.ready || !draft.readiness) return null

  const handleRuleChange = (ruleId, value) => {
    const next = { ...manualResults }
    const result = createManualRuleResult(ruleId, value)
    if (result) next[ruleId] = result
    else delete next[ruleId]
    onChange(next)
  }

  const deliveryCopy = gateResult ? deliveryStatusCopy[gateResult.deliveryStatus] : null
  const hasUniversalBaseline = draft.readiness.hasUniversalBaseline

  return (
    <section className={`specialized-evaluation-task${finalResult ? ' is-complete' : ''}`}>
      <div className="specialized-task-heading">
        <div>
          <span className="section-kicker">SPECIALIZED EVALUATION TASK</span>
          <h2>专项生产评测执行</h2>
          <p>{hasUniversalBaseline ? '复用已有通用证据，其余专项规则由评测人员确认。' : '当前独立进行专项评测；可复用规则改由评测人员确认。'}</p>
        </div>
        <div><span>{finalResult ? '正式专项分' : '专项完成度'}</span><strong>{finalResult ? finalResult.overallScore.toFixed(1) : `${Math.round(draft.readiness.coverage * 100)}%`}</strong><small>{finalResult ? `${finalResult.grade} · ${finalResult.gradeName}` : `${draft.readiness.completedRuleCount}/${draft.readiness.applicableRuleCount} 条`}</small></div>
      </div>

      <div className="specialized-task-rule-list">
        {draft.rubric.rules.map((rule) => {
          const result = draft.values[rule.id]
          const reuseCandidate = rule.source === 'UNIVERSAL_REUSED'
          const reused = result?.evaluatedBy === 'UNIVERSAL_RESULT_REUSE'
          const value = result?.status === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : result?.rawScore ?? ''
          return (
            <article className={reused ? 'is-reused' : ''} key={rule.id}>
              <i />
              <div><span>{rule.category}</span><strong>{rule.name}</strong><p>{rule.description}</p></div>
              <div className="specialized-task-source">
                <b>{resultSourceLabel[result?.evaluatedBy] || (reuseCandidate && !hasUniversalBaseline ? '专项独立确认' : '等待人工确认')}</b>
                <small>{result?.evidence || (reuseCandidate && !hasUniversalBaseline ? '未提供通用结果，请在本次专项评测中确认。' : '尚未完成本规则。')}</small>
                {result?.evaluatedBy === 'LOCAL_GEOMETRY_EVIDENCE' && (
                  <div className="specialized-task-advice">
                    <em>{result.recommendation}</em>
                    <span>还需：{result.requiredEvidence}</span>
                  </div>
                )}
              </div>
              <select disabled={reused || !active || Boolean(finalResult)} value={value} onChange={(event) => handleRuleChange(rule.id, event.target.value)} aria-label={`${rule.name}专项评分`}>
                <option value="">未确认</option>
                <option value="5">5 · 通过</option>
                <option value="4">4 · 良好</option>
                <option value="3">3 · 可用</option>
                <option value="2">2 · 明显问题</option>
                <option value="1">1 · 严重问题</option>
                <option value="0">0 · 不可用</option>
                <option value="NOT_APPLICABLE">不适用</option>
              </select>
            </article>
          )
        })}
      </div>

      <div className="specialized-task-actions">
        <div><small>已有 {draft.readiness.automaticEvidenceCount || 0} 条真实检测证据；仍需逐条确认评分，未确认项保持“未评测”。</small></div>
        {!finalResult && <Button disabled={!active || !draft.readiness.isComplete} onClick={onFinalize}>生成专项结果并执行门槛</Button>}
      </div>

      {finalResult && gateResult && (
        <div className="delivery-gate-result">
          <div className="delivery-gate-score-grid">
            <StatusCard tone="info" label="专项质量结果" title={`${finalResult.overallScore.toFixed(1)} / 100 · ${finalResult.grade} 级`} description={hasUniversalBaseline ? `采用 ${finalResult.scoringMethod}；通用复用项和专项人工项共同形成专项分。` : `采用 ${finalResult.scoringMethod}；本次全部规则由专项评测独立确认。`} meta={hasUniversalBaseline ? '不覆盖通用分' : '通用基础未评测'} />
            <StatusCard tone={deliveryCopy.tone} label="流程准入结论" title={deliveryCopy.name} description={deliveryCopy.description} meta={`${gateResult.blockerCount} 项阻断问题`} />
          </div>
          {gateResult.blockers.length > 0 && (
            <div className="delivery-blocker-list">
              <div><span>BLOCKING ISSUES</span><strong>必须先处理的阻断问题</strong></div>
              {gateResult.blockers.map((blocker) => (
                <article key={blocker.id}>
                  <span>!</span>
                  <div><strong>{blocker.title}</strong><p>{blocker.reason}</p><small><b>解除条件：</b>{blocker.releaseCondition}</small></div>
                  <em>{blocker.source === 'UNIVERSAL' ? '通用门槛' : '专项门槛'}</em>
                </article>
              ))}
            </div>
          )}
          <div className="delivery-report-save">
            <div><strong>{hasUniversalBaseline ? '保存完整评测记录' : '保存专项评测记录'}</strong><p>{hasUniversalBaseline ? '同时保存通用分、专项分、阻断原因和交付状态，不保存模型文件本体。' : '保存专项分、专项门槛和“通用基础未评测”状态，不保存模型文件本体。'}</p></div>
            <Button disabled={saveStatus === 'success'} variant={saveStatus === 'success' ? 'secondary' : 'primary'} onClick={onSave}>{saveStatus === 'success' ? '评测记录已保存' : saveStatus === 'error' ? '重试保存评测记录' : '确认并保存评测记录'}</Button>
          </div>
        </div>
      )}
    </section>
  )
}

export default SpecializedEvaluationPanel
