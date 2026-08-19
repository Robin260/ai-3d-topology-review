import { streetLampTestGroup } from '../../config/sceneTestModels.js'
import './SpecializedTestSetPanel.css'

function SpecializedTestSetPanel({ selectedId, onSelect }) {
  const models = [streetLampTestGroup.baseline, ...streetLampTestGroup.candidates]
  return (
    <section className="specialized-test-set-panel">
      <div>
        <span>REAL TEST SET 01</span>
        <strong>{streetLampTestGroup.name}</strong>
        <small>自动填写：实时交互 · 道具与硬表面 · 平台暂未指定</small>
      </div>
      <div className="specialized-test-set-models">
        {models.map((model) => (
          <button
            className={selectedId === model.id ? 'is-active' : ''}
            type="button"
            key={model.id}
            onClick={() => onSelect(model)}
          >
            <span>{model.role === 'REFERENCE_BASELINE' ? '参考' : 'AI'}</span>
            <strong>{model.shortName}</strong>
          </button>
        ))}
      </div>
    </section>
  )
}

export default SpecializedTestSetPanel
