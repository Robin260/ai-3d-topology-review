import { overlayCapabilityLabels, overlaySections } from '../../config/modelOverlay.js'

function OverlayPanel({ values, analysis, hasModel, onToggle, onClose }) {
  return (
    <aside className="model-overlay-panel" aria-label="模型 Overlay 可视化">
      <div className="model-overlay-panel__heading">
        <div><strong>Overlay 可视化</strong><span>真实几何辅助检查</span></div>
        <button type="button" onClick={onClose} aria-label="收起 Overlay 面板">×</button>
      </div>

      {overlaySections.map((section) => (
        <div className="model-overlay-section" key={section.id}>
          {section.id !== 'visual' && <h4>{section.label}</h4>}
          {section.items.map((item) => {
            const isAvailable = item.capability === 'REAL'
            const disabled = !isAvailable || (!hasModel && item.id !== 'wireframe')
            const count = item.countField && analysis ? analysis[item.countField] : null
            return (
              <label className={`model-overlay-option${disabled ? ' is-disabled' : ''}`} key={item.id} title={overlayCapabilityLabels[item.capability]}>
                <input
                  type="checkbox"
                  checked={Boolean(values[item.id])}
                  disabled={disabled}
                  onChange={() => onToggle(item)}
                />
                <i style={{ '--overlay-color': item.color }} />
                <span>{item.label}</span>
                {Number.isFinite(count) && <b>{count}</b>}
                {!isAvailable && <small>待接入</small>}
              </label>
            )
          })}
        </div>
      ))}

      <p className="model-overlay-panel__note">热力图越红表示局部三角面越密；孔洞图层显示开放边界，需结合设计意图人工确认。</p>
    </aside>
  )
}

export default OverlayPanel

