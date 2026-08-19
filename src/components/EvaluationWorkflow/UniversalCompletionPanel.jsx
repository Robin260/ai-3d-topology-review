import { Button, StatusCard } from '../ui/index.js'
import './UniversalCompletionPanel.css'

function UniversalCompletionPanel({
  draft,
  active,
  finalResult,
  saveStatus = 'idle',
  onFinalize,
  onSave,
}) {
  const readiness = draft?.readiness
  if (!readiness) return null

  const coveragePercent = Math.round(readiness.coverage * 100)
  const remainingCount = readiness.missingRuleIds.length

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
        description={finalResult ? finalResult.summary.overallAssessment : active ? '请逐条检查并确认。系统不会把尚未检查的规则自动设为通过。' : '请先点击页面顶部“确认并开始通用评测”，再进行人工确认。'}
        meta={finalResult ? '门槛与交付状态仍独立计算' : '未完成前不进入正式统计'}
      />

      <div className="universal-completion-actions">
        <div><small>未确认的规则保持“未评测”，不会被当作 0 分或自动通过。</small></div>
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
