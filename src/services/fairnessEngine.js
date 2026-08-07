export function evaluateFairness(context, rules) {
  const items = rules.map((rule) => {
    const value = context[rule.id]
    return {
      ...rule,
      status: value === true ? 'pass' : value === false ? 'fail' : 'unknown',
    }
  })
  const failedRequired = items.filter((item) => item.level === 'required' && item.status !== 'pass')
  const warnings = items.filter((item) => item.level === 'recommended' && item.status !== 'pass')
  const status = failedRequired.length > 0
    ? 'invalid'
    : warnings.length > 0
      ? 'valid_with_warnings'
      : 'valid'

  return {
    status,
    items,
    warnings: warnings.map((item) => `${item.label}未确认`),
    blockingReasons: failedRequired.map((item) => `${item.label}未通过`),
    passedCount: items.filter((item) => item.status === 'pass').length,
    totalCount: items.length,
  }
}
