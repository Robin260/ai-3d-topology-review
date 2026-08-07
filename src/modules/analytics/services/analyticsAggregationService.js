const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

export function aggregateSnapshots(snapshots) {
  const count = snapshots.length
  const modelCount = new Set(snapshots.map((item) => item.modelId)).size
  const averageScore = average(snapshots.map((item) => item.result.totalScore))
  const passCount = snapshots.filter((item) => item.result.pass).length
  const readyCount = snapshots.filter((item) => item.result.productionReady).length
  const blockedSnapshots = snapshots.filter((item) => item.result.blockingIssueCount > 0).length
  const blockerCount = snapshots.reduce((sum, item) => sum + item.result.blockingIssueCount, 0)

  const gradeMap = new Map()
  const dimensionMap = new Map()
  const issueMap = new Map()
  const sourceMap = new Map()

  snapshots.forEach((snapshot) => {
    gradeMap.set(snapshot.result.grade, (gradeMap.get(snapshot.result.grade) || 0) + 1)
    snapshot.dimensionScores.forEach((dimension) => {
      const current = dimensionMap.get(dimension.dimensionId) || { id: dimension.dimensionId, name: dimension.dimensionName, values: [], issueCount: 0 }
      current.values.push(dimension.percentage)
      current.issueCount += snapshot.issues.filter((issue) => issue.dimensionId === dimension.dimensionId).length
      dimensionMap.set(dimension.dimensionId, current)
    })
    snapshot.issues.forEach((issue) => {
      const key = issue.issueCode || issue.ruleId
      const current = issueMap.get(key) || { code: key, title: issue.title, dimensionId: issue.dimensionId, severity: issue.severity, blocking: issue.blocking, instances: 0, snapshotIds: new Set() }
      current.instances += 1
      current.snapshotIds.add(snapshot.snapshotId)
      current.blocking ||= issue.blocking
      issueMap.set(key, current)
    })
    const sourceName = snapshot.source.generatorName || '未标注来源'
    const source = sourceMap.get(sourceName) || { name: sourceName, scores: [], ready: 0, blockers: 0 }
    source.scores.push(snapshot.result.totalScore)
    source.ready += snapshot.result.productionReady ? 1 : 0
    source.blockers += snapshot.result.blockingIssueCount
    sourceMap.set(sourceName, source)
  })

  const trend = [...snapshots]
    .sort((a, b) => new Date(a.evaluatedAt) - new Date(b.evaluatedAt))
    .map((snapshot) => ({
      date: new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(new Date(snapshot.evaluatedAt)),
      score: snapshot.result.totalScore,
      model: `${snapshot.modelName} ${snapshot.modelVersion}`,
      ready: snapshot.result.productionReady ? 100 : 0,
    }))

  return {
    metrics: {
      count,
      modelCount,
      averageScore,
      passRate: count ? passCount / count * 100 : 0,
      readyRate: count ? readyCount / count * 100 : 0,
      blockedSnapshots,
      blockerCount,
    },
    trend,
    grades: [...gradeMap].map(([grade, value]) => ({ grade, value })),
    dimensions: [...dimensionMap.values()].map((item) => ({ id: item.id, name: item.name, average: average(item.values), issueCount: item.issueCount })),
    topIssues: [...issueMap.values()].map((item) => ({ ...item, affectedSnapshots: item.snapshotIds.size, snapshotIds: undefined })).sort((a, b) => b.instances - a.instances),
    sources: [...sourceMap.values()].map((item) => ({ name: item.name, count: item.scores.length, averageScore: average(item.scores), readyRate: item.scores.length ? item.ready / item.scores.length * 100 : 0, blockers: item.blockers })),
  }
}

export function compareSnapshots(left, right, thresholds) {
  if (!left || !right) return null
  const leftIssues = new Map(left.issues.map((issue) => [issue.issueCode || issue.ruleId, issue]))
  const rightIssues = new Map(right.issues.map((issue) => [issue.issueCode || issue.ruleId, issue]))
  const resolved = [...leftIssues.keys()].filter((key) => !rightIssues.has(key))
  const added = [...rightIssues.keys()].filter((key) => !leftIssues.has(key))
  const continuing = [...rightIssues.keys()].filter((key) => leftIssues.has(key))
  const scoreDelta = right.result.totalScore - left.result.totalScore
  const changeLabel = Math.abs(scoreDelta) <= thresholds.stableMax ? '基本稳定' : scoreDelta >= thresholds.clearChangeMin ? '明显改善' : scoreDelta > 0 ? '有所改善' : scoreDelta <= -thresholds.clearChangeMin ? '明显退化' : '轻微退化'
  const dimensionMap = new Map(left.dimensionScores.map((item) => [item.dimensionId, item]))
  const dimensions = right.dimensionScores.map((item) => {
    const before = dimensionMap.get(item.dimensionId)
    return { id: item.dimensionId, name: item.dimensionName, before: before?.percentage ?? null, after: item.percentage, delta: before ? item.percentage - before.percentage : null }
  })
  const sameModel = left.modelId === right.modelId
  const comparable = sameModel && left.rubric.rubricId === right.rubric.rubricId && left.rubric.rubricVersion === right.rubric.rubricVersion
  return { left, right, scoreDelta, changeLabel, resolved, added, continuing, dimensions, comparable, sameModel }
}
