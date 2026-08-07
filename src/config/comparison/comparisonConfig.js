export const comparisonConfig = Object.freeze({
  id: 'PK_COMPARISON_RULES',
  version: '1.0.0',
  compatibleEvaluationVersions: ['1.x'],
  differenceThresholds: {
    tieMax: 2,
    slightMax: 5,
    clearMax: 10,
  },
  fairnessRules: [
    { id: 'sameSource', label: '同一高模来源', level: 'required' },
    { id: 'sameScale', label: '相同尺寸与单位', level: 'required' },
    { id: 'samePose', label: '相同姿态', level: 'required' },
    { id: 'sameOrientation', label: '相同坐标朝向', level: 'required' },
    { id: 'sameParts', label: '包含相同模型部件', level: 'required' },
    { id: 'sameStandardProfile', label: '使用同一专项标准', level: 'required' },
    { id: 'sameReferenceAlignment', label: '使用相同高模配准', level: 'required' },
    { id: 'sameTriangleBudget', label: '相同目标面数预算', level: 'recommended' },
    { id: 'sameMaterialScope', label: '相同材质与UV检测范围', level: 'recommended' },
    { id: 'sameEvaluationVersion', label: '相同评测器版本', level: 'recommended' },
  ],
  confidence: {
    warningPenalty: 6,
    missingEvidencePenalty: 7,
    lowCoveragePenalty: 12,
    highMinimum: 85,
    mediumMinimum: 60,
  },
})

export const comparisonLabels = Object.freeze({
  fairness: {
    valid: '公平性通过',
    valid_with_warnings: '可比较，但有警告',
    low_confidence: '低置信度比较',
    invalid: '不可比较',
  },
  difference: {
    tie: '基本持平',
    slight_advantage: '轻微优势',
    clear_advantage: '明显优势',
    significant_advantage: '显著优势',
  },
  confidence: { high: '高', medium: '中', low: '低' },
  delivery: {
    ready: '可进入下一阶段',
    ready_with_minor_fixes: '小修后可进入下一阶段',
    not_ready: '暂不可交付',
    blocked: '存在阻断问题',
    insufficient_data: '证据不足',
  },
  winner: {
    A: '模型 A',
    B: '模型 B',
    tie: '持平',
    undetermined: '无法判断',
    neither: '两者均不推荐',
    manual_review: '需要人工复核',
    insufficient_data: '证据不足',
  },
})
