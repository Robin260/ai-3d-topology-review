import { modelTestCases } from '../../config/modelTestCases.js'
import { Button } from '../ui/index.js'
import './ModelTestPanel.css'

function ModelTestPanel({ selectedId, onSelect }) {
  return (
    <section className="model-test-panel">
      <div className="model-test-heading">
        <div><span className="section-kicker">PHASE 5 · REAL MODEL TEST CASES</span><h2>内置真实网格测试</h2></div>
        <p>一键加载两种 OBJ 网格，直接查看自动评测对健康模型和问题模型的不同判断。</p>
      </div>
      <div className="model-test-grid">
        {modelTestCases.map((testCase) => (
          <article className={`is-${testCase.tone}${selectedId === testCase.id ? ' is-selected' : ''}`} key={testCase.id}>
            <div className="model-test-symbol">{testCase.tone === 'success' ? '✓' : '!'}</div>
            <div>
              <span>{testCase.shortName}</span>
              <strong>{testCase.name}</strong>
              <p>{testCase.description}</p>
              <small>预期：{testCase.expected}</small>
            </div>
            <Button disabled={selectedId === testCase.id} size="small" variant={selectedId === testCase.id ? 'secondary' : 'ghost'} onClick={() => onSelect(testCase)}>
              {selectedId === testCase.id ? '当前已加载' : '加载并评测'}
            </Button>
          </article>
        ))}
      </div>
      <p className="model-test-note">这两个文件是可实际解析的本地 OBJ，不是预先写死的评分；页面仍会重新读取几何并运行相同的自动评测引擎。</p>
    </section>
  )
}

export default ModelTestPanel
