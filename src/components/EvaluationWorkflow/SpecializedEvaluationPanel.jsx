import { useState } from 'react'
import { createManualRuleResult } from '../../services/universalEvaluationWorkflow.js'
import { deliveryStatusCopy } from '../../services/deliveryGateEngine.js'
import { Button, StatusCard } from '../ui/index.js'
import './SpecializedEvaluationPanel.css'

const resultSourceLabel = {
  UNIVERSAL_RESULT_REUSE: '通用结果复用',
  MANUAL_REVIEWER: '人工确认',
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
  const [batchArmed, setBatchArmed] = useState(false)
  if (!draft?.rubric?.ready || !draft.readiness) return null

  const handleRuleChange = (ruleId, value) => {
    const next = { ...manualResults }
    const result = createManualRuleResult(ruleId, value)
    if (result) next[ruleId] = result
    else delete next[ruleId]
    onChange(next)
  }

  const handleBatchConfirm = () => {
    if (!batchArmed) {
      setBatchArmed(true)
      return
    }
    const next = { ...manualResults }
    draft.readiness.missingRuleIds.forEach((ruleId) => {
      next[ruleId] = createManualRuleResult(ruleId, 5)
    })
    onChange(next)
    setBatchArmed(false)
  }

  const deliveryCopy = gateResult ? deliveryStatusCopy[gateResult.deliveryStatus] : null

  return (
    <section className={`specialized-evaluation-task${finalResult ? ' is-complete' : ''}`}>
      <div className="specialized-task-heading">
        <div>
          <span className="section-kicker">SPECIALIZED EVALUATION TASK</span>
          <h2>专项生产评测执行</h2>
          <p>复用通用结果，不重复扣分；专项新增规则由评测人员结合目标流程确认。</p>
        </div>
        <div><span>{finalResult ? '正式专项分' : '专项完成度'}</span><strong>{finalResult ? finalResult.overallScore.toFixed(1) : `${Math.round(draft.readiness.coverage * 100)}%`}</strong><small>{finalResult ? `${finalResult.grade} · ${finalResult.gradeName}` : `${draft.readiness.completedRuleCount}/${draft.readiness.applicableRuleCount} 条`}</small></div>
      </div>

      <div className="specialized-task-rule-list">
        {draft.rubric.rules.map((rule) => {
          const result = draft.values[rule.id]
          const reused = rule.source === 'UNIVERSAL_REUSED'
          const value = result?.status === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : result?.rawScore ?? ''
          return (
            <article className={reused ? 'is-reused' : ''} key={rule.id}>
              <i />
              <div><span>{rule.category}</span><strong>{rule.name}</strong><p>{rule.description}</p></div>
              <div className="specialized-task-source"><b>{resultSourceLabel[result?.evaluatedBy] || (reused ? '等待通用结果' : '等待人工确认')}</b><small>{result?.evidence || '尚未完成本规则。'}</small></div>
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
        <div>
          <Button variant={batchArmed ? 'danger' : 'secondary'} disabled={!active || draft.readiness.missingRuleIds.length === 0 || Boolean(finalResult)} onClick={handleBatchConfirm}>
            {batchArmed ? '再次点击：确认专项人工判断' : '其余专项项全部设为通过'}
          </Button>
          <small>快捷操作不会改变通用层自动结果，也不代表AI已完成专项检测。</small>
        </div>
        {!finalResult && <Button disabled={!active || !draft.readiness.isComplete} onClick={onFinalize}>生成专项结果并执行门槛</Button>}
      </div>

      {finalResult && gateResult && (
        <div className="delivery-gate-result">
          <div className="delivery-gate-score-grid">
            <StatusCard tone="info" label="专项质量结果" title={`${finalResult.overallScore.toFixed(1)} / 100 · ${finalResult.grade} 级`} description={`采用 ${finalResult.scoringMethod}；通用复用项和专项人工项共同形成专项分。`} meta="不覆盖通用分" />
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
            <div><strong>保存完整评测记录</strong><p>同时保存通用分、专项分、阻断原因和交付状态，不保存模型文件本体。</p></div>
            <Button disabled={saveStatus === 'success'} variant={saveStatus === 'success' ? 'secondary' : 'primary'} onClick={onSave}>{saveStatus === 'success' ? '完整报告已保存' : saveStatus === 'error' ? '重试保存完整报告' : '确认并保存完整报告'}</Button>
          </div>
        </div>
      )}
    </section>
  )
}

export default SpecializedEvaluationPanel

