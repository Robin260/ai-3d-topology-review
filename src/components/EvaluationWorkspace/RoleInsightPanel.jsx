import { useMemo, useState } from 'react'
import { AI_HANDOFF_COPY, AI_INTERPRETATION_ROLES } from '../../config/aiInterpretation.js'
import { buildChatGptHandoff, buildRoleInsights } from '../../services/aiInterpretationService.js'
import Button from '../ui/Button.jsx'
import './EvaluationWorkspace.css'

function RoleInsightPanel({ stage, modelName, modelFormat, result, gateResult, productionContext }) {
  const [activeRoleId, setActiveRoleId] = useState(AI_INTERPRETATION_ROLES[0].id)
  const [copyStatus, setCopyStatus] = useState('idle')
  const insights = useMemo(() => buildRoleInsights({ result, gateResult, productionContext }), [gateResult, productionContext, result])
  const prompt = useMemo(() => buildChatGptHandoff({ stage, modelName, modelFormat, result, gateResult, productionContext }), [gateResult, modelFormat, modelName, productionContext, result, stage])
  const insight = insights[activeRoleId]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopyStatus('success')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <section className="role-insight-panel">
      <div className="role-insight-tabs" role="tablist" aria-label="岗位建议">
        {AI_INTERPRETATION_ROLES.map((role) => (
          <button className={activeRoleId === role.id ? 'is-active' : ''} key={role.id} type="button" role="tab" aria-selected={activeRoleId === role.id} onClick={() => setActiveRoleId(role.id)}>{role.shortName}</button>
        ))}
      </div>
      <div className="role-insight-content">
        <span>本地规则解读 · 不冒充 AI 返回</span>
        <h3>{insight.headline}</h3>
        <p>{insight.summary}</p>
        <ul>{insight.actions.map((action) => <li key={action}>{action}</li>)}</ul>
      </div>
      <div className="chatgpt-handoff">
        <div><strong>{AI_HANDOFF_COPY.title}</strong><small>{AI_HANDOFF_COPY.description}</small></div>
        <div>
          <Button size="small" variant="secondary" onClick={handleCopy}>{copyStatus === 'success' ? AI_HANDOFF_COPY.copiedLabel : copyStatus === 'error' ? AI_HANDOFF_COPY.unavailableLabel : AI_HANDOFF_COPY.copyLabel}</Button>
          <Button as="a" size="small" href="https://chatgpt.com/" target="_blank" rel="noreferrer">{AI_HANDOFF_COPY.openLabel}</Button>
        </div>
      </div>
    </section>
  )
}

export default RoleInsightPanel

