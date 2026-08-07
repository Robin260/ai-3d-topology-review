const downloadText = (content, fileName, mimeType) => {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportSnapshotsJson(snapshots) {
  downloadText(JSON.stringify({ exportedAt: new Date().toISOString(), snapshots }, null, 2), 'topolens-analytics.json', 'application/json')
}

export function exportSnapshotsCsv(snapshots) {
  const rows = [
    ['snapshotId', 'modelName', 'version', 'score', 'grade', 'productionReady', 'blockingIssues', 'evaluatedAt'],
    ...snapshots.map((item) => [item.snapshotId, item.modelName, item.modelVersion, item.result.totalScore, item.result.grade, item.result.productionReady, item.result.blockingIssueCount, item.evaluatedAt]),
  ]
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  downloadText(`\uFEFF${csv}`, 'topolens-analytics.csv', 'text/csv;charset=utf-8')
}
