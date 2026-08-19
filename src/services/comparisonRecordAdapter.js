const hasComparableResult = (record) => (
  record?.type === 'single'
  && Number.isFinite(record?.universalResult?.overallScore)
  && record?.universalResult?.dimensionScores
)

const updatedTime = (record) => new Date(record.updatedAt || record.createdAt || 0).getTime()

export function getComparableEvaluationRecords(records = []) {
  return records
    .filter(hasComparableResult)
    .sort((a, b) => updatedTime(b) - updatedTime(a))
}

const sameKnownValue = (valueA, valueB) => {
  if (valueA == null || valueB == null || valueA === '' || valueB === '') return undefined
  return valueA === valueB
}

const toComparisonModel = (record) => {
  const result = record.universalResult
  const savedModel = record.modelA || {}
  return {
    ...result,
    evaluationId: result.evaluationId || record.id,
    model: {
      ...result.model,
      modelId: savedModel.modelId || result.model?.modelId || record.id,
      name: savedModel.name || result.model?.name || '未命名模型',
      fileFormat: savedModel.format || result.model?.fileFormat || 'UNKNOWN',
      previewSource: record.modelReference?.url || null,
      sourceType: record.modelReference?.sourceType || savedModel.sourceType || 'unknown',
    },
  }
}

const getProfileId = (record) => (
  record.specializedResult?.rubricId
  || record.productionContext?.standardProfileId
  || record.productionContext?.profileId
  || null
)

const getEvaluationVersion = (record) => (
  record.universalResult?.rubricVersion
  || record.rubricVersion
  || null
)

const readablePair = (valueA, valueB, fallback) => {
  if (valueA && valueA === valueB) return valueA
  if (valueA || valueB) return `${valueA || '未设置'} ↔ ${valueB || '未设置'}`
  return fallback
}

export function createComparisonInputFromRecords(recordA, recordB) {
  if (!hasComparableResult(recordA) || !hasComparableResult(recordB)) {
    throw new Error('comparison_records_incomplete')
  }
  if (recordA.id === recordB.id) throw new Error('comparison_records_must_differ')

  const modelA = toComparisonModel(recordA)
  const modelB = toComparisonModel(recordB)
  const profileA = getProfileId(recordA)
  const profileB = getProfileId(recordB)
  const versionA = getEvaluationVersion(recordA)
  const versionB = getEvaluationVersion(recordB)
  const targetA = recordA.productionContext?.productionTargetName || recordA.productionContext?.productionTargetId
  const targetB = recordB.productionContext?.productionTargetName || recordB.productionContext?.productionTargetId
  const sourceA = recordA.modelReference?.sourceId || recordA.modelA?.modelId
  const sourceB = recordB.modelReference?.sourceId || recordB.modelA?.modelId

  const fairnessContext = {
    sameSource: sameKnownValue(sourceA, sourceB),
    sameScale: undefined,
    samePose: undefined,
    sameOrientation: undefined,
    sameParts: undefined,
    sameStandardProfile: sameKnownValue(profileA, profileB),
    sameReferenceAlignment: undefined,
    sameTriangleBudget: undefined,
    sameMaterialScope: undefined,
    sameEvaluationVersion: sameKnownValue(versionA, versionB),
  }
  const missingEvidence = [
    ['尺寸与单位', fairnessContext.sameScale],
    ['模型姿态', fairnessContext.samePose],
    ['坐标朝向', fairnessContext.sameOrientation],
    ['模型部件范围', fairnessContext.sameParts],
    ['高模配准关系', fairnessContext.sameReferenceAlignment],
    ['目标三角面预算', fairnessContext.sameTriangleBudget],
    ['材质、UV 检测范围', fairnessContext.sameMaterialScope],
  ].filter(([, value]) => value == null).map(([label]) => label)

  return {
    comparisonId: `PK_${recordA.id}_${recordB.id}`,
    referenceModelId: sourceA && sourceA === sourceB ? sourceA : null,
    productionTarget: readablePair(targetA, targetB, '仅通用评测'),
    standardProfileId: readablePair(profileA, profileB, '尚未完成专项评测'),
    evaluationVersion: readablePair(versionA, versionB, '版本未知'),
    fairnessContext,
    modelA,
    modelB,
    blockersA: recordA.gateResult?.blockers || [],
    blockersB: recordB.gateResult?.blockers || [],
    missingEvidence,
    metadata: {
      source: 'local_records',
      label: '本机历史评测记录',
      recordIds: [recordA.id, recordB.id],
    },
  }
}

