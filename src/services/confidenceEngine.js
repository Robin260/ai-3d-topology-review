export function calculateComparisonConfidence({ fairness, modelA, modelB, missingEvidence }, config) {
  let score = 100
  score -= fairness.warnings.length * config.warningPenalty
  score -= missingEvidence.length * config.missingEvidencePenalty
  const averageCoverage = ((modelA.evaluatedCoverage || 0) + (modelB.evaluatedCoverage || 0)) / 2
  if (averageCoverage < 0.9) score -= config.lowCoveragePenalty
  if (fairness.status === 'invalid') score = Math.min(score, 35)
  score = Math.max(0, Math.round(score))
  const level = score >= config.highMinimum ? 'high' : score >= config.mediumMinimum ? 'medium' : 'low'
  return {
    score,
    level,
    reasons: [`公平性通过 ${fairness.passedCount}/${fairness.totalCount} 项`, `平均指标覆盖率 ${Math.round(averageCoverage * 100)}%`],
    missingEvidence,
  }
}
