import { useEffect, useMemo, useState } from 'react'
import { Button, EmptyState } from '../../../components/ui/index.js'
import { loadAnalyticsDataset } from '../adapters/evaluationSnapshotAdapter.js'
import AnalyticsCompare from '../components/AnalyticsCompare.jsx'
import AnalyticsHistory from '../components/AnalyticsHistory.jsx'
import AnalyticsOverview from '../components/AnalyticsOverview.jsx'
import AnalyticsPendingEvaluations from '../components/AnalyticsPendingEvaluations.jsx'
import AnalyticsReports from '../components/AnalyticsReports.jsx'
import { analyticsConfig, analyticsLabels } from '../config/analyticsConfig.js'
import { aggregateSnapshots, compareSnapshots } from '../services/analyticsAggregationService.js'
import {
  filterSnapshots,
  getDefaultVersionComparison,
  getFilterOptions,
  getLaterVersionSnapshots,
  getVersionBaselineSnapshots,
  sortSnapshots,
} from '../services/analyticsQueryService.js'
import { exportSnapshotsCsv, exportSnapshotsJson } from '../services/reportService.js'
import './AnalyticsPage.css'

const defaultFilters = { rangeId: 'all', days: null, search: '', source: 'all', grade: 'all', ready: 'all' }

function AnalyticsPage() {
  const [dataset, setDataset] = useState(() => loadAnalyticsDataset())
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState(defaultFilters)
  const [sortBy, setSortBy] = useState('latest')
  const options = useMemo(() => getFilterOptions(dataset.snapshots), [dataset])
  const filtered = useMemo(() => filterSnapshots(dataset.snapshots, filters), [dataset, filters])
  const sorted = useMemo(() => sortSnapshots(filtered, sortBy), [filtered, sortBy])
  const aggregate = useMemo(() => aggregateSnapshots(filtered), [filtered])
  const initialComparison = getDefaultVersionComparison(dataset.snapshots)
  const [leftId, setLeftId] = useState(initialComparison.left)
  const [rightId, setRightId] = useState(initialComparison.right)
  const leftSnapshots = useMemo(() => getVersionBaselineSnapshots(filtered), [filtered])
  const rightSnapshots = useMemo(() => getLaterVersionSnapshots(filtered, leftId), [filtered, leftId])

  useEffect(() => {
    if (!leftSnapshots.some((item) => item.snapshotId === leftId)) {
      const nextComparison = getDefaultVersionComparison(filtered)
      setLeftId(nextComparison.left)
      setRightId(nextComparison.right)
      return
    }
    if (!rightSnapshots.some((item) => item.snapshotId === rightId)) {
      setRightId(rightSnapshots.at(-1)?.snapshotId || '')
    }
  }, [filtered, leftId, leftSnapshots, rightId, rightSnapshots])

  const comparison = useMemo(() => compareSnapshots(
    filtered.find((item) => item.snapshotId === leftId),
    filtered.find((item) => item.snapshotId === rightId),
    analyticsConfig.comparisonThresholds,
  ), [filtered, leftId, rightId])

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }))
  const changeTimeRange = (rangeId) => {
    const range = analyticsConfig.timeRanges.find((item) => item.id === rangeId)
    setFilters((current) => ({ ...current, rangeId, days: range?.days ?? null }))
  }
  const resetFilters = () => setFilters(defaultFilters)
  const refreshData = () => setDataset(loadAnalyticsDataset())

  return (
    <div className="analytics-page">
      <div className="page-heading-row analytics-page-heading">
        <div><span className="section-kicker">Evaluation Analytics</span><h1>评测数据统计与分析</h1><p>查看历史版本、质量趋势、问题分布和报告；本页面只分析已有结果，不修改原始评分。</p></div>
        <span className={`analytics-source-badge is-${dataset.source}`}><i />{analyticsLabels.source[dataset.source]}</span>
      </div>

      <section className="analytics-filter-bar" aria-label="统计筛选条件">
        <label className="analytics-search"><span>搜索模型</span><input value={filters.search} placeholder="名称、ID或版本" onChange={(event) => updateFilter('search', event.target.value)} /></label>
        <label><span>时间范围</span><select value={filters.rangeId} onChange={(event) => changeTimeRange(event.target.value)}>{analyticsConfig.timeRanges.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label><span>模型来源</span><select value={filters.source} onChange={(event) => updateFilter('source', event.target.value)}><option value="all">全部来源</option>{options.sources.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span>质量等级</span><select value={filters.grade} onChange={(event) => updateFilter('grade', event.target.value)}><option value="all">全部等级</option>{options.grades.map((item) => <option key={item} value={item}>{item} 级</option>)}</select></label>
        <label><span>交付状态</span><select value={filters.ready} onChange={(event) => updateFilter('ready', event.target.value)}><option value="all">全部状态</option><option value="true">可进入下一阶段</option><option value="false">暂不可交付</option></select></label>
        <div className="analytics-filter-actions"><Button size="small" variant="secondary" onClick={resetFilters}>重置</Button><Button size="small" onClick={refreshData}>刷新数据</Button></div>
      </section>

      <div className="analytics-scope-row">
        <span>当前显示 <strong>{filtered.length}</strong> 条评测记录</span>
        {dataset.comparisonRecords?.length > 0 && <span>已保存 <strong>{dataset.comparisonRecords.length}</strong> 条 PK 记录</span>}
        <span>Rubric：UNIVERSAL_RETOPO_V1</span>
        {dataset.rejectedCount > 0 && <span className="is-warning">{dataset.rejectedCount} 条未完成评测未计入正式统计</span>}
        {dataset.source === 'mock' && <span className="is-warning">本地没有可统计记录，当前使用演示快照</span>}
      </div>

      <nav className="analytics-tabs" aria-label="统计分析页面" role="tablist">
        {analyticsConfig.tabs.map((tab) => <button className={activeTab === tab.id ? 'is-active' : ''} type="button" role="tab" aria-selected={activeTab === tab.id} key={tab.id} onClick={() => setActiveTab(tab.id)}><span>{tab.label}</span><small>{tab.shortLabel}</small></button>)}
      </nav>

      {activeTab === 'pending' ? (
        <div className="analytics-tab-content"><AnalyticsPendingEvaluations records={dataset.pendingRecords || []} /></div>
      ) : activeTab === 'history' && (filtered.length > 0 || dataset.comparisonRecords?.length > 0) ? (
        <div className="analytics-tab-content"><AnalyticsHistory snapshots={sorted} comparisons={dataset.comparisonRecords || []} sortBy={sortBy} onSortChange={setSortBy} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState compact eyebrow="当前筛选条件没有结果" title="没有可以分析的评测记录" description="请重置筛选条件，或者完成并保存一次模型评测。" actions={<Button onClick={resetFilters}>重置筛选</Button>} />
      ) : (
        <div className="analytics-tab-content">
          {activeTab === 'overview' && <AnalyticsOverview aggregate={aggregate} />}
          {activeTab === 'compare' && <AnalyticsCompare leftSnapshots={leftSnapshots} rightSnapshots={rightSnapshots} leftId={leftId} rightId={rightId} onLeftChange={setLeftId} onRightChange={setRightId} comparison={comparison} />}
          {activeTab === 'reports' && <AnalyticsReports count={filtered.length} onExportJson={() => exportSnapshotsJson(filtered)} onExportCsv={() => exportSnapshotsCsv(filtered)} />}
        </div>
      )}

      <section className="boundary-note"><span className="boundary-icon">i</span><div><strong>统计只消费评测快照</strong><p>筛选、图表、版本变化和报告导出都不会重新评分，也不会修改原始质量分、Ready状态或阻断结论。</p></div></section>
    </div>
  )
}

export default AnalyticsPage
