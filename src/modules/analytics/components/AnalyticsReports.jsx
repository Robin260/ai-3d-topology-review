import { Button } from '../../../components/ui/index.js'

function AnalyticsReports({ count, onExportJson, onExportCsv }) {
  return (
    <div className="analytics-report-grid">
      <article className="analytics-report-card"><span>JSON</span><h2>结构化数据备份</h2><p>保留当前筛选范围内的完整快照字段，适合系统迁移、调试和后续接口接入。</p><Button onClick={onExportJson}>导出 {count} 条 JSON</Button></article>
      <article className="analytics-report-card"><span>CSV</span><h2>表格分析数据</h2><p>导出模型、版本、分数、等级、Ready状态和阻断数量，适合Excel或其他分析工具。</p><Button variant="secondary" onClick={onExportCsv}>导出 {count} 条 CSV</Button></article>
      <article className="analytics-report-card is-planned"><span>PDF</span><h2>可视化汇报文档</h2><p>将来用于技术复盘、项目汇报和模型版本验收。当前阶段暂不生成模拟PDF。</p><Button variant="ghost" disabled>后续阶段接入</Button></article>
    </div>
  )
}

export default AnalyticsReports
