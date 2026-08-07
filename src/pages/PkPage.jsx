import ComparisonDashboard from '../components/Comparison/ComparisonDashboard.jsx'
import { comparisonMockInput } from '../data/comparisonMock.js'
import { buildComparisonRecord } from '../services/comparisonService.js'
import './pages.css'

const comparisonRecord = buildComparisonRecord(comparisonMockInput)

function PkPage() {
  return (
    <div className="page-stack">
      <div className="page-heading-row">
        <div><span className="section-kicker">Comparison Layer · MVP</span><h1>模型 PK 对比</h1><p>复用两份单模型评测结果，先检查公平性和阻断问题，再解释质量、性能与风险差异。</p></div>
        <span className="info-chip">结构化 Mock 数据</span>
      </div>
      <ComparisonDashboard record={comparisonRecord} />
    </div>
  )
}

export default PkPage
