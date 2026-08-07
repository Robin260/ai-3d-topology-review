import { useEffect, useState } from 'react'
import { Button, StatusCard } from '../ui/index.js'
import './UniversalCompletionPanel.css'

function UniversalCompletionPanel({
  draft,
  active,
  finalResult,
  saveStatus = 'idle',
  onConfirmRemaining,
  onFinalize,
  onSave,
}) {
  const [batchArmed, setBatchArmed] = useState(false)
  const readiness = draft?.readiness

  useEffect(() => setBatchArmed(false), [draft?.result?.evaluationId])
  if (!readiness) return null

  const coveragePercent = Math.round(readiness.coverage * 100)
  const remainingCount = readiness.missingRuleIds.length

  const handleBatch = () => {
    if (!batchArmed) {
      setBatchArmed(true)
      return
    }
    onConfirmRemaining?.()
    setBatchArmed(false)
  }

  return (
    <section className={`universal-completion-panel${finalResult ? ' is-complete' : ''}`}>
      <div className="universal-completion-panel__heading">
        <div>
          <span className="section-kicker">UNIVERSAL EVALUATION COMPLETION</span>
          <h2>完成通用正式评测</h2>
          <p>真实自动检测结果保持锁定；其余项目需要人工确认，全部完成后才能生成正式100分。</p>
        </div>
        <div className="universal-completion-panel__score">
          <span>{finalResult ? '正式质量分' : '任务完成度'}</span>
          <strong>{finalResult ? finalResult.overallScore.toFixed(1) : `${coveragePercent}%`}</strong>
          <small>{finalResult ? `${finalResult.grade} · ${finalResult.gradeName}` : `${readiness.completedRuleCount}/${readiness.applicableRuleCount} 条`}</small>
        </div>
      </div>

      <div className="universal-completion-progress"><i style={{ width: `${coveragePercent}%` }} /></div>

      <div className="universal-completion-metrics">
        <div><span>真实自动锁定</span><strong>{readiness.lockedAutomaticCount}</strong></div>
        <div><span>人工已确认</span><strong>{readiness.manualConfirmedCount}</strong></div>
        <div><span>标记不适用</span><strong>{readiness.notApplicableRuleCount}</strong></div>
        <div><span>仍待确认</span><strong>{remainingCount}</strong></div>
      </div>

      <StatusCard
        tone={finalResult ? 'success' : readiness.isComplete ? 'info' : 'warning'}
        label={finalResult ? '正式通用结果' : '评测完整性检查'}
        title={finalResult ? `已生成 ${finalResult.grade} 级正式质量结果` : readiness.isComplete ? '所有通用规则已经处理，可以生成正式结果' : `还需要确认 ${remainingCount} 条规则`}
        description={finalResult ? finalResult.summary.overallAssessment : active ? '可以逐条评分，也可以在实际人工检查后使用快捷确认。自动锁定结果不会被快捷操作覆盖。' : '请先点击页面顶部“确认并开始通用评测”，再进行人工确认。'}
        meta={finalResult ? '门槛与交付状态仍独立计算' : '未完成前不进入正式统计'}
      />

      <div className="universal-completion-actions">
        <div>
          <Button variant={batchArmed ? 'danger' : 'secondary'} disabled={!active || remainingCount === 0 || Boolean(finalResult)} onClick={handleBatch}>
            {batchArmed ? '再次点击：确认由人工判断负责' : '其余待确认项全部设为通过'}
          </Button>
          <small>快捷操作代表评测人员已经检查，不代表AI自动检测。</small>
        </div>
        <div>
          {!finalResult ? (
            <Button disabled={!active || !readiness.isComplete} onClick={onFinalize}>生成正式通用结果</Button>
          ) : (
            <Button disabled={saveStatus === 'success'} variant={saveStatus === 'success' ? 'secondary' : 'primary'} onClick={onSave}>
              {saveStatus === 'success' ? '正式结果已保存' : saveStatus === 'error' ? '重试保存正式结果' : '保存正式通用结果'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default UniversalCompletionPanel

