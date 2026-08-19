import { useMemo, useState } from 'react'
import ComparisonDashboard from '../components/Comparison/ComparisonDashboard.jsx'
import { Button, EmptyState } from '../components/ui/index.js'
import { comparisonMockInput } from '../data/comparisonMock.js'
import { buildComparisonRecord } from '../services/comparisonService.js'
import { createComparisonInputFromRecords, getComparableEvaluationRecords } from '../services/comparisonRecordAdapter.js'
import { storageService } from '../services/storageService.js'
import './pages.css'
import './PkPage.css'

const recordLabel = (record) => {
  const score = record.universalResult?.overallScore
  const date = new Date(record.updatedAt || record.createdAt).toLocaleDateString('zh-CN')
  return `${record.modelA?.name || '未命名模型'} · ${Number(score).toFixed(1)} 分 · ${date}`
}

function PkPage() {
  const comparableRecords = useMemo(() => getComparableEvaluationRecords(storageService.getRecords()), [])
  const [mode, setMode] = useState(comparableRecords.length >= 2 ? 'records' : 'demo')
  const [recordAId, setRecordAId] = useState(comparableRecords[0]?.id || '')
  const [recordBId, setRecordBId] = useState(comparableRecords.find((item) => item.id !== comparableRecords[0]?.id)?.id || '')
  const comparisonRecord = useMemo(() => {
    if (mode === 'demo') return buildComparisonRecord(comparisonMockInput)
    const recordA = comparableRecords.find((item) => item.id === recordAId)
    const recordB = comparableRecords.find((item) => item.id === recordBId)
    if (!recordA || !recordB || recordA.id === recordB.id) return null
    return buildComparisonRecord(createComparisonInputFromRecords(recordA, recordB))
  }, [comparableRecords, mode, recordAId, recordBId])

  return (
    <div className="page-stack">
      <div className="page-heading-row">
        <div><span className="section-kicker">Comparison Layer · MVP</span><h1>模型 PK 对比</h1><p>复用两份单模型评测结果，先检查公平性和阻断问题，再解释质量、性能与风险差异。</p></div>
        <span className="info-chip">{mode === 'records' ? '真实历史评测结果' : '结构化演示数据'}</span>
      </div>

      <section className="pk-source-panel">
        <div className="pk-source-heading">
          <div><span className="section-kicker">COMPARISON SOURCE</span><h2>选择要比较的两次评测</h2></div>
          <div className="pk-source-actions">
            <Button variant={mode === 'records' ? 'primary' : 'secondary'} disabled={comparableRecords.length < 2} onClick={() => setMode('records')}>历史记录</Button>
            <Button variant={mode === 'demo' ? 'primary' : 'secondary'} onClick={() => setMode('demo')}>演示 PK</Button>
          </div>
        </div>
        {comparableRecords.length >= 2 ? (
          <>
            <div className="pk-record-selectors">
              <label>模型 A<select value={recordAId} onChange={(event) => setRecordAId(event.target.value)}>{comparableRecords.map((record) => <option disabled={record.id === recordBId} value={record.id} key={record.id}>{recordLabel(record)}</option>)}</select></label>
              <span className="pk-record-arrow">PK</span>
              <label>模型 B<select value={recordBId} onChange={(event) => setRecordBId(event.target.value)}>{comparableRecords.map((record) => <option disabled={record.id === recordAId} value={record.id} key={record.id}>{recordLabel(record)}</option>)}</select></label>
            </div>
            <p className="pk-source-note">真实模式比较已保存的评分、维度、门槛和交付状态。浏览器不会保存本地模型文件，因此本地上传模型只比较结果；内置模型仍可恢复三维预览。</p>
          </>
        ) : (
          <EmptyState title="还需要至少两份完整评测" description="请先在单模型评测页完成并保存两个通用评测结果；现在仍可使用演示 PK 查看完整结构。" />
        )}
      </section>

      {comparisonRecord && <ComparisonDashboard record={comparisonRecord} />}
    </div>
  )
}

export default PkPage

