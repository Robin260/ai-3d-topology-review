import { useEffect, useMemo, useState } from 'react'
import { detectionTypeLabels, ruleStatusLabels } from '../../config/rule.js'
import { createManualRuleResult, isLockedAutomaticResult } from '../../services/universalEvaluationWorkflow.js'
import './ScoreForm.css'

const severityLabels = {
  FATAL: '致命',
  CRITICAL: '严重',
  MAJOR: '主要',
  MINOR: '轻微',
  INFO: '提示',
}

function ScoreForm({
  rubric,
  rules = [],
  values = {},
  issues = [],
  mode = 'REFERENCE_COMPARISON',
  selectedDimensionId,
  onDimensionChange,
  onChange,
  disabled = false,
}) {
  const dimensions = rubric?.dimensions || []
  const selectedDimension = dimensions.find((item) => item.id === selectedDimensionId) || dimensions[0]
  const visibleRules = useMemo(() => {
    if (!selectedDimension) return []
    const ruleMap = new Map(rules.map((rule) => [rule.id, rule]))
    return selectedDimension.ruleIds
      .map((ruleId) => ruleMap.get(ruleId))
      .filter((rule) => rule?.applicableModes.includes(mode))
  }, [mode, rules, selectedDimension])
  const [selectedRuleId, setSelectedRuleId] = useState(null)

  useEffect(() => {
    const issueRuleId = issues.find((issue) => issue.dimensionId === selectedDimension?.id)?.ruleId
    setSelectedRuleId(issueRuleId || visibleRules[0]?.id || null)
  }, [issues, selectedDimension?.id, visibleRules])

  if (!selectedDimension) {
    return <div className="score-form__empty" role="status">当前没有可用的通用评测配置。</div>
  }

  const selectedRule = visibleRules.find((rule) => rule.id === selectedRuleId) || visibleRules[0]
  const selectedIssue = issues.find((issue) => issue.ruleId === selectedRule?.id)

  const handleScoreChange = (rule, rawValue) => {
    if (!onChange) return
    const nextValues = { ...values }
    const result = createManualRuleResult(rule.id, rawValue)
    if (result) nextValues[rule.id] = result
    else delete nextValues[rule.id]
    onChange(nextValues, { ruleId: rule.id, result })
  }

  const handleClearManual = () => {
    const nextValues = { ...values }
    visibleRules.forEach((rule) => {
      if (nextValues[rule.id]?.evaluatedBy === 'MANUAL_REVIEWER') delete nextValues[rule.id]
    })
    onChange?.(nextValues, { dimensionId: selectedDimension.id, action: 'clear_manual' })
  }

  return (
    <section className="rule-detail-panel">
      <header className="rule-detail-panel__header">
        <div>
          <span>三级规则与证据</span>
          <h2>{selectedDimension.name} · 规则详情</h2>
        </div>
        <div className="rule-detail-panel__controls">
          <label>
            <span className="visually-hidden">选择评测维度</span>
            <select value={selectedDimension.id} onChange={(event) => onDimensionChange?.(event.target.value)}>
              {dimensions.map((dimension) => <option key={dimension.id} value={dimension.id}>{dimension.name}</option>)}
            </select>
          </label>
          {onChange && (
            <div className="rule-detail-panel__quick-actions">
              <button type="button" disabled={disabled} onClick={handleClearManual}>清除人工确认</button>
            </div>
          )}
          <span className="not-evaluated-note">未评测项不按 0 分计算</span>
        </div>
      </header>

      <div className="detection-legend" aria-label="检测方式图例">
        {Object.entries(detectionTypeLabels).map(([id, label]) => (
          <span className={`detection-chip type-${id.toLowerCase()}`} key={id}><i />{label}</span>
        ))}
      </div>

      <div className="rule-detail-grid">
        <div className="rule-table" role="table" aria-label={`${selectedDimension.name}规则列表`}>
          <div className="rule-table__head" role="row">
            <span>规则名称</span><span>检测方式</span><span>状态</span><span>得分</span>
          </div>
          <div className="rule-table__body">
            {visibleRules.map((rule) => {
              const result = values[rule.id]
              const status = result?.status || 'NOT_EVALUATED'
              const rawScore = result?.rawScore
              const isSelected = rule.id === selectedRule?.id
              const isLockedAutomatic = isLockedAutomaticResult(result)
              const selectedValue = status === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : rawScore ?? ''

              return (
                <div
                  className={`rule-row${isSelected ? ' is-selected' : ''}`}
                  key={rule.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRuleId(rule.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setSelectedRuleId(rule.id)
                  }}
                >
                  <span className="rule-row__name"><strong>{rule.name}</strong><small>{rule.id}</small></span>
                  <span className={`detection-type type-${rule.evaluationType.toLowerCase()}`}><i />{detectionTypeLabels[rule.evaluationType]}</span>
                  <span className="rule-status-cell">
                    <span className={`rule-status status-${status.toLowerCase()}`}>{ruleStatusLabels[status] || status}</span>
                    <small>{isLockedAutomatic ? '自动锁定' : result?.evaluatedBy === 'MANUAL_REVIEWER' ? '人工确认' : '等待确认'}</small>
                  </span>
                  {onChange ? (
                    <label className="rule-score-input" onClick={(event) => event.stopPropagation()}>
                      <select disabled={disabled || isLockedAutomatic} value={selectedValue} onChange={(event) => handleScoreChange(rule, event.target.value)}>
                        <option value="">未确认</option>
                        <option value="5">5 · 通过</option>
                        <option value="4">4 · 良好</option>
                        <option value="3">3 · 可用</option>
                        <option value="2">2 · 明显问题</option>
                        <option value="1">1 · 严重问题</option>
                        <option value="0">0 · 不可用</option>
                        <option value="NOT_APPLICABLE">不适用</option>
                      </select>
                    </label>
                  ) : (
                    <span className="rule-row__score">{rawScore ?? '—'} <small>/ 5</small></span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="rule-explanation">
          <div className="rule-explanation__title">
            <div><span>{selectedRule?.id}</span><h3>{selectedRule?.name}</h3></div>
            <span className={`severity severity-${selectedIssue?.severity?.toLowerCase() || selectedRule?.defaultSeverity?.toLowerCase()}`}>
              {severityLabels[selectedIssue?.severity || selectedRule?.defaultSeverity]}
            </span>
          </div>
          <p className="rule-description">{selectedRule?.description}</p>
          <div className="explanation-block">
            <strong>证据</strong>
            <p>{selectedIssue?.evidence || '当前没有完成该规则的检测，因此没有可展示的证据。'}</p>
          </div>
          <div className="explanation-block">
            <strong>影响</strong>
            <p>{selectedIssue?.consequence || '完成检测后，这里会解释问题对模型质量和后续流程的影响。'}</p>
          </div>
          <div className="explanation-block">
            <strong>修改建议</strong>
            <p>{selectedIssue?.suggestion || selectedRule?.suggestions?.[0] || '等待规则结果。'}</p>
          </div>
          <button className="locate-button" type="button" disabled title="问题坐标与 3D 热区联动将在真实几何分析阶段接入">定位模型区域 · 待接入</button>
        </aside>
      </div>
    </section>
  )
}

export default ScoreForm
