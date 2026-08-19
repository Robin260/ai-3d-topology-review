import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ComparisonDashboard from '../components/Comparison/ComparisonDashboard.jsx'
import LiveComparisonWorkspace from '../components/LiveComparison/LiveComparisonWorkspace.jsx'
import { Button, EmptyState } from '../components/ui/index.js'
import { comparisonMockInput } from '../data/comparisonMock.js'
import { buildComparisonRecord } from '../services/comparisonService.js'
import { createComparisonInputFromRecords, createPkStorageRecord, getComparableEvaluationRecords } from '../services/comparisonRecordAdapter.js'
import { storageService } from '../services/storageService.js'
import './pages.css'
import './PkPage.css'

const recordLabel = (record) => {
  const score = record.universalResult?.overallScore
  const date = new Date(record.updatedAt || record.createdAt).toLocaleDateString('zh-CN')
  return `${record.modelA?.name || '未命名模型'} · ${Number(score).toFixed(1)} 分 · ${date}`
}

function PkPage() {
  const [searchParams] = useSearchParams()
  const savedComparison = storageService.getRecord(searchParams.get('record'))?.comparisonResult || null
  const comparableRecords = useMemo(() => getComparableEvaluationRecords(storageService.getRecords()), [])
  const [mode, setMode] = useState(savedComparison ? 'saved' : 'live')
  const [recordAId, setRecordAId] = useState(comparableRecords[0]?.id || '')
  const [recordBId, setRecordBId] = useState(comparableRecords.find((item) => item.id !== comparableRecords[0]?.id)?.id || '')
  const [saveState, setSaveState] = useState('idle')
  const comparisonRecord = useMemo(() => {
    if (mode === 'saved' && savedComparison) return savedComparison
    if (mode === 'live') return null
    if (mode === 'demo') return buildComparisonRecord(comparisonMockInput)
    const recordA = comparableRecords.find((item) => item.id === recordAId)
    const recordB = comparableRecords.find((item) => item.id === recordBId)
    if (!recordA || !recordB || recordA.id === recordB.id) return null
    return buildComparisonRecord(createComparisonInputFromRecords(recordA, recordB))
  }, [comparableRecords, mode, recordAId, recordBId, savedComparison])

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setSaveState('idle')
  }

  const changeRecordA = (event) => {
    setRecordAId(event.target.value)
    setSaveState('idle')
  }

  const changeRecordB = (event) => {
    setRecordBId(event.target.value)
    setSaveState('idle')
  }

  const saveComparison = () => {
    if (!comparisonRecord || mode !== 'records') return
    const saved = storageService.saveRecord(createPkStorageRecord(comparisonRecord))
    setSaveState(saved.ok ? 'saved' : 'error')
  }

  return (
    <div className="page-stack">
      <div className="page-heading-row">
        <div><span className="section-kicker">Comparison Layer · LIVE</span><h1>模型 PK 对比</h1><p>直接导入两个模型查看真实几何差异；历史评分与演示结构保留为辅助入口。</p></div>
        <span className="info-chip">{mode === 'live' ? '本地实时几何 PK' : mode === 'saved' ? '已保存 PK 记录' : mode === 'records' ? '真实历史评测结果' : '结构化演示数据'}</span>
      </div>

      <section className="pk-mode-panel" aria-label="PK 数据来源">
        <div><strong>选择比较方式</strong><span>推荐直接导入两个模型；文件不会上传。</span></div>
        <div>
          <Button variant={mode === 'live' ? 'primary' : 'secondary'} onClick={() => changeMode('live')}>实时导入 PK</Button>
          <Button variant={mode === 'records' ? 'primary' : 'secondary'} disabled={comparableRecords.length < 2} onClick={() => changeMode('records')}>历史评测 PK</Button>
          <Button variant={mode === 'demo' ? 'primary' : 'secondary'} onClick={() => changeMode('demo')}>演示结构</Button>
        </div>
      </section>

      {mode === 'live' && <LiveComparisonWorkspace />}

      {mode !== 'live' && <>
      <section className="pk-source-panel">
        <div className="pk-source-heading">
          <div><span className="section-kicker">COMPARISON SOURCE</span><h2>选择要比较的两次评测</h2></div>
          <div className="pk-source-actions">
            <Button variant="secondary" disabled={mode !== 'records' || !comparisonRecord} onClick={saveComparison}>{saveState === 'saved' ? '已保存' : '保存 PK 结果'}</Button>
          </div>
        </div>
        {comparableRecords.length >= 2 ? (
          <>
            <div className="pk-record-selectors">
              <label>模型 A<select value={recordAId} onChange={changeRecordA}>{comparableRecords.map((record) => <option disabled={record.id === recordBId} value={record.id} key={record.id}>{recordLabel(record)}</option>)}</select></label>
              <span className="pk-record-arrow">PK</span>
              <label>模型 B<select value={recordBId} onChange={changeRecordB}>{comparableRecords.map((record) => <option disabled={record.id === recordAId} value={record.id} key={record.id}>{recordLabel(record)}</option>)}</select></label>
            </div>
            <p className="pk-source-note">真实模式比较已保存的评分、维度、门槛和交付状态。浏览器不会保存本地模型文件，因此本地上传模型只比较结果；内置模型仍可恢复三维预览。</p>
            {saveState === 'saved' && <p className="pk-save-message is-success" role="status">PK 结果已保存到本机浏览器，刷新页面后仍可读取。</p>}
            {saveState === 'error' && <p className="pk-save-message is-error" role="alert">保存失败。请检查浏览器是否禁止本地存储，原评测结果没有被修改。</p>}
          </>
        ) : (
          <EmptyState title="还需要至少两份完整评测" description="请先在单模型评测页完成并保存两个通用评测结果；现在仍可使用演示 PK 查看完整结构。" />
        )}
      </section>

      {comparisonRecord && <ComparisonDashboard record={comparisonRecord} />}
      </>}
    </div>
  )
}

export default PkPage
