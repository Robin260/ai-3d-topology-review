const deliveryStatus = (blockers, issueCount) => {
  if (blockers.length > 0) return 'blocked'
  if (issueCount > 0) return 'ready_with_minor_fixes'
  return 'ready'
}

export function createRecommendation({ fairness, comparison, modelA, modelB, blockersA, blockersB }) {
  const deliveryA = deliveryStatus(blockersA, modelA.issues?.length || 0)
  const deliveryB = deliveryStatus(blockersB, modelB.issues?.length || 0)
  let overallWinner = comparison.qualityWinner
  let deliveryRecommendation = comparison.qualityWinner
  let rationale = '两者均无阻断问题，结合质量差异与当前生产目标进行推荐。'

  if (fairness.status === 'invalid') {
    overallWinner = 'undetermined'
    deliveryRecommendation = 'manual_review'
    rationale = '公平性检查未通过，当前不能输出可靠胜负。'
  } else if (blockersA.length > 0 && blockersB.length > 0) {
    overallWinner = 'undetermined'
    deliveryRecommendation = 'neither'
    rationale = '两版都存在阻断问题，应先修复再重新比较。'
  } else if (blockersA.length > 0) {
    overallWinner = 'B'
    deliveryRecommendation = 'B'
    rationale = '模型 A 存在阻断问题，优先推荐当前无阻断的模型 B。'
  } else if (blockersB.length > 0) {
    overallWinner = 'A'
    deliveryRecommendation = 'A'
    rationale = '模型 B 虽然质量分较高，但存在阻断问题，优先推荐当前无阻断的模型 A。'
  }

  const trianglesA = modelA.meshStatistics?.triangleCount
  const trianglesB = modelB.meshStatistics?.triangleCount
  const performanceWinner = Number.isFinite(trianglesA) && Number.isFinite(trianglesB)
    ? trianglesA === trianglesB ? 'tie' : trianglesA < trianglesB ? 'A' : 'B'
    : 'undetermined'
  const riskWinner = blockersA.length === blockersB.length
    ? 'tie'
    : blockersA.length < blockersB.length ? 'A' : 'B'

  return {
    winners: {
      overallWinner,
      qualityWinner: comparison.qualityWinner,
      performanceWinner,
      riskWinner,
      deliveryRecommendation,
    },
    delivery: { A: deliveryA, B: deliveryB },
    rationale,
  }
}
