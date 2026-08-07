import Button from '../ui/Button.jsx'
import './EvaluationTaskControls.css'

function EvaluationTaskControls({
  activeStage,
  hasModel,
  hasUniversalResult,
  productionContextComplete,
  onStartUniversal,
  onStartSpecialized,
}) {
  const universalActive = activeStage === 'universal'
  const specializedActive = activeStage === 'specialized'
  const specializedReady = hasModel && hasUniversalResult && productionContextComplete && activeStage !== 'idle'

  return (
    <section className="evaluation-task-controls" aria-label="评测任务开始控制">
      <div className={`evaluation-task-card${universalActive ? ' is-active' : ''}${specializedActive ? ' is-complete' : ''}`}>
        <span className="evaluation-task-card__index">01</span>
        <div className="evaluation-task-card__content">
          <span>Universal Task</span>
          <strong>通用标准评测任务</strong>
          <p>先运行所有模型必须经过的基础拓扑检查，不选择生产用途。</p>
        </div>
        <Button
          variant={universalActive ? 'secondary' : 'primary'}
          disabled={!hasModel || universalActive}
          onClick={onStartUniversal}
        >
          {!hasModel ? '请先导入模型' : universalActive ? '通用评测进行中' : specializedActive ? '重新进入通用评测' : '确认并开始通用评测'}
        </Button>
      </div>

      <div className={`evaluation-task-card is-specialized${specializedActive ? ' is-active' : ''}`}>
        <span className="evaluation-task-card__index">02</span>
        <div className="evaluation-task-card__content">
          <span>Specialized Task</span>
          <strong>专项生产评测任务</strong>
          <p>在通用结果之上，按生产流程、资产类型和平台装配专项规则。</p>
        </div>
        <Button
          variant={specializedActive ? 'secondary' : 'ghost'}
          disabled={!specializedReady || specializedActive}
          onClick={onStartSpecialized}
        >
          {!hasModel
            ? '请先导入模型'
            : !hasUniversalResult
              ? '等待通用结果'
              : !productionContextComplete
                ? '请先选择生产上下文'
                : specializedActive
                  ? '专项评测进行中'
                  : '确认并开始专项评测'}
        </Button>
      </div>

      <p className="evaluation-task-controls__boundary" role="status" aria-live="polite">
        {activeStage === 'idle' && '尚未开始任务。开始按钮只切换工作阶段，不代表模型通过。'}
        {universalActive && '当前正在进行通用标准评测；未检测规则仍保持“未评测”。'}
        {specializedActive && '当前正在进行专项生产评测；通用分、硬性门槛和交付状态保持独立。'}
      </p>
    </section>
  )
}

export default EvaluationTaskControls

