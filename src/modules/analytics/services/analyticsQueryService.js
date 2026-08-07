const normalize = (value) => String(value || '').trim().toLowerCase()

export function filterSnapshots(snapshots, filters) {
  const latestTime = Math.max(...snapshots.map((item) => new Date(item.evaluatedAt).getTime()).filter(Number.isFinite), Date.now())
  const cutoff = filters.days ? latestTime - filters.days * 24 * 60 * 60 * 1000 : null
  const search = normalize(filters.search)

  return snapshots.filter((snapshot) => {
    if (cutoff && new Date(snapshot.evaluatedAt).getTime() < cutoff) return false
    if (filters.source !== 'all' && snapshot.source.generatorName !== filters.source) return false
    if (filters.grade !== 'all' && snapshot.result.grade !== filters.grade) return false
    if (filters.ready !== 'all' && String(snapshot.result.productionReady) !== filters.ready) return false
    if (search && !normalize(`${snapshot.modelName} ${snapshot.modelId} ${snapshot.modelVersion}`).includes(search)) return false
    return true
  })
}

export function sortSnapshots(snapshots, sortBy = 'latest') {
  const result = [...snapshots]
  if (sortBy === 'score_desc') return result.sort((a, b) => b.result.totalScore - a.result.totalScore)
  if (sortBy === 'score_asc') return result.sort((a, b) => a.result.totalScore - b.result.totalScore)
  if (sortBy === 'name') return result.sort((a, b) => a.modelName.localeCompare(b.modelName, 'zh-CN'))
  return result.sort((a, b) => new Date(b.evaluatedAt) - new Date(a.evaluatedAt))
}

export function getFilterOptions(snapshots) {
  return {
    sources: [...new Set(snapshots.map((item) => item.source.generatorName))].sort(),
    grades: [...new Set(snapshots.map((item) => item.result.grade))].sort(),
  }
}

const compareSnapshotTime = (a, b) => {
  const timeDifference = new Date(a.evaluatedAt).getTime() - new Date(b.evaluatedAt).getTime()
  if (timeDifference !== 0) return timeDifference
  return a.snapshotId.localeCompare(b.snapshotId)
}

export function getVersionGroups(snapshots) {
  const grouped = new Map()
  snapshots.forEach((snapshot) => {
    grouped.set(snapshot.modelId, [...(grouped.get(snapshot.modelId) || []), snapshot])
  })
  return [...grouped.values()]
    .map((items) => [...items].sort(compareSnapshotTime))
    .filter((items) => items.length >= 2)
}

export function getVersionBaselineSnapshots(snapshots) {
  return getVersionGroups(snapshots).flatMap((versions) => versions.slice(0, -1))
}

export function getLaterVersionSnapshots(snapshots, baselineId) {
  const baseline = snapshots.find((snapshot) => snapshot.snapshotId === baselineId)
  if (!baseline) return []
  return snapshots
    .filter((snapshot) => snapshot.modelId === baseline.modelId && compareSnapshotTime(snapshot, baseline) > 0)
    .sort(compareSnapshotTime)
}

export function getDefaultVersionComparison(snapshots, preferredModelId = null) {
  const groups = getVersionGroups(snapshots)
  const versions = groups.find((items) => items[0].modelId === preferredModelId) || groups[0] || []
  return {
    left: versions[0]?.snapshotId || '',
    right: versions.at(-1)?.snapshotId || '',
  }
}
