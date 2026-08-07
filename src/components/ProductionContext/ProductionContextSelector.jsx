import { useMemo } from 'react'
import {
  assetTypes,
  getAssetType,
  getModelSource,
  getPipelineStage,
  getPlatformProfile,
  getPlatformProfilesForTarget,
  getProductionTarget,
  modelSources,
  pipelineStages,
  productionTargets,
} from '../../config/productionContext.js'
import { composeSpecializedRubric } from '../../services/rubricService.js'
import { StatusCard } from '../ui/index.js'
import './ProductionContextSelector.css'

const sourceLabels = {
  UNIVERSAL_REUSED: '复用通用结果',
  SPECIALIZED_NEW: '专项新增',
}

const methodLabels = {
  REUSE_RESULT: '不重复检测',
  AUTOMATIC: '自动检测',
  HYBRID: '自动 + 人工',
  MANUAL: '人工评审',
}

const implementationLabels = {
  REUSED_RESULT: '真实复用',
  DEMO_CONFIG: '规则已装配 · 人工确认',
  NOT_IMPLEMENTED: '人工确认可用',
}

function ChoiceGroup({ label, description, name, options, value, onChange, compact = false }) {
  return (
    <fieldset className={`production-choice-group${compact ? ' is-compact' : ''}`}>
      <legend>{label}</legend>
      <p>{description}</p>
      <div className="production-choice-grid">
        {options.map((option) => (
          <label className={value === option.id ? 'production-choice is-selected' : 'production-choice'} key={option.id}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <span className="production-choice__marker" aria-hidden="true" />
            <strong>{option.name}</strong>
            <small>{option.description}</small>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ProductionContextSelector({ value, onChange, baseEvaluation = null }) {
  const target = getProductionTarget(value.productionTargetId)
  const assetType = getAssetType(value.assetTypeId)
  const platform = getPlatformProfile(value.platformProfileId)
  const modelSource = getModelSource(value.modelSourceId)
  const pipelineStage = getPipelineStage(value.pipelineStageId)
  const platformOptions = getPlatformProfilesForTarget(value.productionTargetId)
  const composedRubric = useMemo(() => composeSpecializedRubric(value), [value])
  const isComplete = composedRubric.ready
  const baseDisplayScore = baseEvaluation?.overallScore ?? baseEvaluation?.partialScore ?? null
  const baseIsPartial = baseEvaluation?.evaluationState === 'PARTIAL_AUTOMATIC'

  const updateField = (field, nextValue) => onChange({ ...value, [field]: nextValue })
  const updateTarget = (nextTargetId) => {
    const currentPlatformIsValid = getPlatformProfilesForTarget(nextTargetId)
      .some((item) => item.id === value.platformProfileId)
    onChange({
      ...value,
      productionTargetId: nextTargetId,
      platformProfileId: currentPlatformIsValid ? value.platformProfileId : null,
    })
  }

  return (
    <section className="production-context-panel">
      <div className="production-context-heading">
        <div>
          <span className="section-kicker">SPECIALIZED PRODUCTION EVALUATION</span>
          <h2>第二层 · 专项生产评测</h2>
          <p>先记录来源，再用“生产流程 + 资产类型 + 目标平台”组合专项规则；通用分保持不变。</p>
        </div>
        <span className="info-chip">先通用 · 后专项 · 两套结论</span>
      </div>

      <ChoiceGroup
        compact
        label="来源信息 · 这个模型从哪里来？"
        description="只用于统计、追踪和同源对比，不会自动加分或扣分。"
        name="model-source"
        options={modelSources}
        value={value.modelSourceId}
        onChange={(nextValue) => updateField('modelSourceId', nextValue)}
      />

      <ChoiceGroup
        label="1. 选择生产流程"
        description="它最终要进入哪一种生产工作流？这是专项规则的第一层分支。"
        name="production-target"
        options={productionTargets}
        value={value.productionTargetId}
        onChange={updateTarget}
      />

      <ChoiceGroup
        label="2. 选择资产类型"
        description="资产类型与生产流程分别保存，同一个角色可以分别评测实时、动画或展示用途。"
        name="asset-type"
        options={assetTypes}
        value={value.assetTypeId}
        onChange={(nextValue) => updateField('assetTypeId', nextValue)}
      />

      <ChoiceGroup
        compact
        label="3. 选择目标平台"
        description={target ? `当前只显示适用于“${target.name}”的平台；平台决定预算和交付档案。` : '请先选择生产流程，系统才会显示可用平台。'}
        name="platform-profile"
        options={platformOptions}
        value={value.platformProfileId}
        onChange={(nextValue) => updateField('platformProfileId', nextValue)}
      />

      <div className="pipeline-stage-field">
        <div>
          <strong>当前制作阶段（可选补充）</strong>
          <span>用于说明问题应在什么时候修复，不参与专项规则组合，也不改变分数。</span>
        </div>
        <select value={value.pipelineStageId || ''} onChange={(event) => updateField('pipelineStageId', event.target.value || null)}>
          <option value="">暂未指定</option>
          {pipelineStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </select>
      </div>

      <div className="production-score-separation">
        <StatusCard
          tone={baseEvaluation ? 'success' : 'neutral'}
          label="第一层 · 通用基础评测"
          title={baseEvaluation ? `${baseDisplayScore?.toFixed(1) ?? '—'} / 100 · ${baseIsPartial ? '部分自动结果' : `${baseEvaluation.grade} 级`}` : '未评测 · 无法给出基础分'}
          description={baseEvaluation ? (baseIsPartial ? '只保留已测规则表现，覆盖不足时不生成正式基础等级。' : '保留已经得到的基础质量分和基础准入状态。') : '需要先完成通用规则检查；未检测项目不会按零分处理。'}
          meta={baseEvaluation?.productionReadyBase || 'NOT_EVALUATED'}
        />
        <div className="score-not-equal" aria-label="两个分数不合并">≠</div>
        <StatusCard
          tone={isComplete ? 'info' : 'neutral'}
          label="第二层 · 专项生产评测"
          title={isComplete ? '规则组合完成 · 专项分仍未评测' : '未评测 · 请完成三项选择'}
          description={isComplete ? `${target.name} · ${assetType.name} · ${platform.name}` : '系统不会猜测模型用途，也不会生成虚假的专项分数。'}
          meta="NOT_EVALUATED · — / 100"
        />
      </div>

      {isComplete && (
        <div className="specialized-rubric-preview">
          <div className="specialized-rubric-heading">
            <div>
              <span>COMPOSED SPECIALIZED RUBRIC</span>
              <h3>本次将调用 {composedRubric.rules.length} 条专项规则</h3>
              <p>{modelSource ? `来源：${modelSource.name}（仅记录）` : '来源：尚未填写'} · {pipelineStage ? `阶段：${pipelineStage.name}` : '阶段：尚未填写'}</p>
            </div>
            <div className="rubric-summary-pills">
              <strong>{composedRubric.rules.filter((rule) => rule.source === 'UNIVERSAL_REUSED').length} 条复用</strong>
              <strong>{composedRubric.rules.filter((rule) => rule.source === 'SPECIALIZED_NEW').length} 条新增</strong>
            </div>
          </div>
          <div className="specialized-rule-list">
            {composedRubric.rules.map((rule) => (
              <article key={rule.id} className={rule.source === 'UNIVERSAL_REUSED' ? 'is-reused' : ''}>
                <div>
                  <span>{rule.category}</span>
                  <strong>{rule.name}</strong>
                  <p>{rule.description}</p>
                </div>
                <div className="rule-origin">
                  <b>{sourceLabels[rule.source]}</b>
                  <small>{methodLabels[rule.method]}</small>
                  <em>{implementationLabels[rule.implementationStatus]}</em>
                </div>
              </article>
            ))}
          </div>
          <p className="specialized-preview-note">规则组合与人工确认已经接入；只有具备可靠几何证据的结果才会自动复用，尚未验证的平台数值阈值不会伪装成自动检测。</p>
        </div>
      )}
    </section>
  )
}

export default ProductionContextSelector
