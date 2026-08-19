import { Link } from 'react-router-dom'
import { deliveryStatusCopy } from '../../services/deliveryGateEngine.js'
import Button from '../ui/Button.jsx'
import './EvaluationWorkspace.css'

function Step({ index, title, value, state = 'pending' }) {
  return (
    <li className={`evaluation-step is-${state}`}>
      <span>{index}</span>
      <div><strong>{title}</strong><small>{value}</small></div>
    </li>
  )
}

function EvaluationStepRail({
  stage,
  modelName,
  hasModel,
  automaticResult,
  finalUniversalResult,
  contextLabels,
  finalSpecializedResult,
  gateResult,
  activeStage,
  onImport,
  onStartUniversal,
  onStartSpecialized,
}) {
  if (stage === 'specialized') {
    const canStart = hasModel && contextLabels.complete
    return (
      <aside className="evaluation-step-rail" aria-label="专项生产评测步骤">
        <ol>
          <Step index="1" title="导入模型" value={hasModel ? modelName : 'GLB · GLTF · OBJ · FBX'} state={hasModel ? 'complete' : 'current'} />
          <Step index="2" title="生产目标" value={contextLabels.target || '请选择'} state={contextLabels.target ? 'complete' : 'current'} />
          <Step index="3" title="资产类型" value={contextLabels.assetType || '请选择'} state={contextLabels.assetType ? 'complete' : 'pending'} />
          <Step index="4" title="使用平台" value={contextLabels.platform || '请选择'} state={contextLabels.platform ? 'complete' : 'pending'} />
          <Step index="5" title="专项结论" value={gateResult ? deliveryStatusCopy[gateResult.deliveryStatus]?.name || '结果已生成' : finalSpecializedResult ? '结果已生成' : finalUniversalResult ? '可复用通用结果' : '可独立评测'} state={gateResult ? 'complete' : activeStage === 'specialized' ? 'current' : 'pending'} />
        </ol>
        {!hasModel ? (
          <Button onClick={onImport}>导入模型</Button>
        ) : (
          <Button disabled={!canStart || activeStage === 'specialized'} onClick={onStartSpecialized}>
            {activeStage === 'specialized' ? '专项评测进行中' : canStart ? '开始专项评测' : '先完成生产选择'}
          </Button>
        )}
      </aside>
    )
  }

  return (
    <aside className="evaluation-step-rail" aria-label="通用标准评测步骤">
      <ol>
        <Step index="1" title="导入模型" value={hasModel ? modelName : 'GLB · GLTF · OBJ · FBX'} state={hasModel ? 'complete' : 'current'} />
        <Step index="2" title="几何预检" value={automaticResult ? `${automaticResult.evaluatedRuleCount} 条已检测` : '等待模型'} state={automaticResult ? 'complete' : hasModel ? 'current' : 'pending'} />
        <Step index="3" title="规则确认" value={finalUniversalResult ? '已完成' : automaticResult ? '等待人工确认' : '尚未开始'} state={finalUniversalResult ? 'complete' : automaticResult ? 'current' : 'pending'} />
        <Step index="4" title="质量结果" value={finalUniversalResult ? `${finalUniversalResult.overallScore.toFixed(1)} / 100` : '等待生成'} state={finalUniversalResult ? 'complete' : 'pending'} />
        <Step index="5" title="进入专项" value={finalUniversalResult ? '已解锁' : '通用结果完成后'} state={finalUniversalResult ? 'current' : 'pending'} />
      </ol>
      {finalUniversalResult ? (
        <Button as={Link} to="/evaluate/specialized">进入专项评测</Button>
      ) : !hasModel ? (
        <Button onClick={onImport}>导入模型</Button>
      ) : (
        <Button disabled={activeStage === 'universal'} onClick={onStartUniversal}>
          {activeStage === 'universal' ? '通用评测进行中' : '开始通用评测'}
        </Button>
      )}
    </aside>
  )
}

export default EvaluationStepRail
