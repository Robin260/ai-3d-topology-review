export const analyticsConfig = Object.freeze({
  version: '1.0.0',
  tabs: [
    { id: 'overview', label: '数据总览', shortLabel: 'Overview' },
    { id: 'history', label: '历史记录', shortLabel: 'History' },
    { id: 'pending', label: '待完善记录', shortLabel: 'Pending' },
    { id: 'compare', label: '版本对比', shortLabel: 'Compare' },
    { id: 'reports', label: '报告中心', shortLabel: 'Reports' },
  ],
  timeRanges: [
    { id: 'all', label: '全部时间', days: null },
    { id: '7d', label: '最近 7 天', days: 7 },
    { id: '30d', label: '最近 30 天', days: 30 },
    { id: '90d', label: '最近 90 天', days: 90 },
  ],
  comparisonThresholds: { stableMax: 2, clearChangeMin: 5 },
  minimumStabilitySample: 3,
})

export const analyticsLabels = Object.freeze({
  ready: { true: '可进入下一阶段', false: '暂不可交付' },
  source: { local: '本地历史记录', mock: '结构化演示数据' },
})
