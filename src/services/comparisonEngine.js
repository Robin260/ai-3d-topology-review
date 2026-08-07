const differenceLevel = (delta, thresholds) => {
  const absoluteDelta = Math.abs(delta)
  if (absoluteDelta < thresholds.tieMax) return 'tie'
  if (absoluteDelta <= thresholds.slightMax) return 'slight_advantage'
  if (absoluteDelta <= thresholds.clearMax) return 'clear_advantage'
  return 'significant_advantage'
}

const winnerFromDelta = (delta, level) => {
  if (level === 'tie') return 'tie'
  return delta > 0 ? 'A' : 'B'
}

export function compareEvaluationResults(modelA, modelB, dimensions, thresholds) {
  const comparisons = dimensions.map((dimension) => {
    const resultA = modelA.dimensionScores?.[dimension.id]
    const resultB = modelB.dimensionScores?.[dimension.id]
    if (!resultA || !resultB) {
      return {
        dimensionId: dimension.id,
        label: dimension.name,
        modelA: resultA?.score ?? null,
        modelB: resultB?.score ?? null,
        maximum: dimension.weight,
        normalizedA: null,
        normalizedB: null,
        delta: null,
        winner: 'insufficient_data',
        differenceLevel: 'tie',
        weight: dimension.weight,
      }
    }
    const normalizedA = resultA.score / dimension.weight * 100
    const normalizedB = resultB.score / dimension.weight * 100
    const delta = normalizedA - normalizedB
    const level = differenceLevel(delta, thresholds)
    return {
      dimensionId: dimension.id,
      label: dimension.name,
      modelA: resultA.score,
      modelB: resultB.score,
      maximum: dimension.weight,
      normalizedA,
      normalizedB,
      delta,
      winner: winnerFromDelta(delta, level),
      differenceLevel: level,
      weight: dimension.weight,
    }
  })

  const totalDelta = modelA.overallScore - modelB.overallScore
  const totalLevel = differenceLevel(totalDelta, thresholds)
  return {
    dimensions: comparisons,
    totalDelta,
    totalLevel,
    qualityWinner: winnerFromDelta(totalDelta, totalLevel),
  }
}
