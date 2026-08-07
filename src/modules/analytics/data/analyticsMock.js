import universalRubric from '../../../config/rubrics/universal/rubric.json' with { type: 'json' }

const issueLibrary = {
  POLE: { issueCode: 'HIGH_RISK_POLE', ruleId: 'EF_POLE_PLACEMENT', dimensionId: 'EDGE_FLOW', title: '高风险极点', severity: 'MAJOR', blocking: false },
  DENSITY: { issueCode: 'DENSITY_IMBALANCE', ruleId: 'DE_LOCAL_DENSITY', dimensionId: 'DENSITY_EFFICIENCY', title: '局部面密度失衡', severity: 'MAJOR', blocking: false },
  ZERO: { issueCode: 'ZERO_AREA_FACE', ruleId: 'MH_ZERO_AREA', dimensionId: 'MESH_HEALTH', title: '零面积几何', severity: 'MINOR', blocking: false },
  NORMAL: { issueCode: 'FLIPPED_NORMAL', ruleId: 'MH_NORMAL_DIRECTION', dimensionId: 'MESH_HEALTH', title: '法线方向异常', severity: 'CRITICAL', blocking: true },
  NON_MANIFOLD: { issueCode: 'NON_MANIFOLD', ruleId: 'MH_NON_MANIFOLD', dimensionId: 'MESH_HEALTH', title: '非流形结构', severity: 'CRITICAL', blocking: true },
  SILHOUETTE: { issueCode: 'SILHOUETTE_LOSS', ruleId: 'SF_SILHOUETTE', dimensionId: 'SHAPE_FIDELITY', title: '关键轮廓损失', severity: 'MAJOR', blocking: false },
}

const gradeFromScore = (score) => score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'E'

const makeDimensions = (percentages) => universalRubric.dimensions.map((dimension, index) => {
  const percentage = percentages[index] ?? percentages.at(-1) ?? 0
  return {
    dimensionId: dimension.id,
    dimensionName: dimension.name,
    score: Number((dimension.weight * percentage / 100).toFixed(2)),
    maxScore: dimension.weight,
    percentage,
  }
})

const makeIssues = (snapshotId, issueKeys) => issueKeys.map((key, index) => ({
  issueId: `${snapshotId}_ISSUE_${index + 1}`,
  ...issueLibrary[key],
  affectedArea: key === 'POLE' ? '肩部' : key === 'DENSITY' ? '躯干' : '局部网格',
}))

const makeSnapshot = ({ id, modelId, modelName, version, generator, target, asset, score, ready, date, dimensions, issues }) => {
  const snapshotIssues = makeIssues(id, issues)
  return {
    snapshotId: id,
    modelId,
    modelName,
    modelVersionId: `${modelId}_${version}`,
    modelVersion: version,
    source: { type: generator === '人工制作' ? 'MANUAL' : 'AI_GENERATED', generatorId: generator.toUpperCase().replaceAll(' ', '_'), generatorName: generator },
    evaluationContext: { productionTargetId: target.id, productionTargetName: target.name, assetTypeId: asset.id, assetTypeName: asset.name },
    rubric: { rubricId: universalRubric.rubricId, rubricVersion: universalRubric.version },
    result: {
      totalScore: score,
      maxScore: 100,
      grade: gradeFromScore(score),
      pass: score >= 60,
      productionReady: ready,
      blockingIssueCount: snapshotIssues.filter((issue) => issue.blocking).length,
    },
    dimensionScores: makeDimensions(dimensions),
    issues: snapshotIssues,
    evaluatedAt: date,
    createdAt: date,
    metadata: { source: 'mock' },
  }
}

const realtime = { id: 'REALTIME_GAME', name: '实时游戏与交互应用' }
const visualization = { id: 'VISUALIZATION', name: '展示与可视化' }
const character = { id: 'CHARACTER_CREATURE', name: '角色与生物' }
const prop = { id: 'PROP_HARD_SURFACE', name: '道具与硬表面' }
const environment = { id: 'ENVIRONMENT', name: '场景与环境' }

export const analyticsMockSnapshots = Object.freeze([
  makeSnapshot({ id: 'SNAP_001', modelId: 'CHAR_A', modelName: 'Character A', version: 'v1.0', generator: 'TopoGen A', target: realtime, asset: character, score: 72.4, ready: false, date: '2026-07-02T10:00:00+08:00', dimensions: [76, 74, 66, 68, 78, 75, 70], issues: ['POLE', 'DENSITY', 'NORMAL'] }),
  makeSnapshot({ id: 'SNAP_002', modelId: 'DRONE_P', modelName: 'Drone Prop', version: 'v1.0', generator: 'TopoGen B', target: realtime, asset: prop, score: 79.6, ready: true, date: '2026-07-06T11:30:00+08:00', dimensions: [84, 78, 74, 72, 86, 82, 78], issues: ['DENSITY', 'ZERO'] }),
  makeSnapshot({ id: 'SNAP_003', modelId: 'CREATURE_C', modelName: 'Creature C', version: 'v1.0', generator: 'TopoGen A', target: realtime, asset: character, score: 68.8, ready: false, date: '2026-07-10T09:20:00+08:00', dimensions: [70, 73, 61, 64, 72, 69, 67], issues: ['POLE', 'NON_MANIFOLD', 'SILHOUETTE'] }),
  makeSnapshot({ id: 'SNAP_004', modelId: 'CHAR_A', modelName: 'Character A', version: 'v1.1', generator: 'TopoGen A', target: realtime, asset: character, score: 81.7, ready: true, date: '2026-07-14T14:00:00+08:00', dimensions: [86, 82, 78, 80, 83, 84, 79], issues: ['POLE', 'DENSITY'] }),
  makeSnapshot({ id: 'SNAP_005', modelId: 'ROCK_ENV', modelName: 'Rock Environment Kit', version: 'v1.0', generator: '人工制作', target: visualization, asset: environment, score: 88.2, ready: true, date: '2026-07-18T16:10:00+08:00', dimensions: [92, 90, 82, 84, 88, 94, 87], issues: ['ZERO'] }),
  makeSnapshot({ id: 'SNAP_006', modelId: 'DRONE_P', modelName: 'Drone Prop', version: 'v1.1', generator: 'TopoGen B', target: realtime, asset: prop, score: 85.4, ready: true, date: '2026-07-22T13:40:00+08:00', dimensions: [90, 84, 80, 78, 92, 89, 83], issues: ['DENSITY'] }),
  makeSnapshot({ id: 'SNAP_007', modelId: 'NPC_B', modelName: 'NPC Character B', version: 'v1.0', generator: 'TopoGen B', target: realtime, asset: character, score: 76.5, ready: false, date: '2026-07-25T10:30:00+08:00', dimensions: [78, 80, 70, 69, 84, 79, 74], issues: ['POLE', 'NORMAL'] }),
  makeSnapshot({ id: 'SNAP_008', modelId: 'CREATURE_C', modelName: 'Creature C', version: 'v1.1', generator: 'TopoGen A', target: realtime, asset: character, score: 79.9, ready: true, date: '2026-07-28T15:00:00+08:00', dimensions: [84, 82, 74, 76, 80, 81, 78], issues: ['POLE', 'SILHOUETTE'] }),
  makeSnapshot({ id: 'SNAP_009', modelId: 'CHAR_A', modelName: 'Character A', version: 'v1.2', generator: 'TopoGen A', target: realtime, asset: character, score: 87.3, ready: true, date: '2026-07-31T17:20:00+08:00', dimensions: [91, 88, 84, 85, 87, 90, 86], issues: ['DENSITY'] }),
  makeSnapshot({ id: 'SNAP_010', modelId: 'ROCK_ENV', modelName: 'Rock Environment Kit', version: 'v1.1', generator: 'TopoGen B', target: visualization, asset: environment, score: 84.1, ready: true, date: '2026-08-02T12:00:00+08:00', dimensions: [87, 86, 78, 79, 91, 88, 82], issues: ['ZERO', 'DENSITY'] }),
  makeSnapshot({ id: 'SNAP_011', modelId: 'VEHICLE_D', modelName: 'Vehicle D', version: 'v1.0', generator: 'TopoGen B', target: realtime, asset: prop, score: 90.6, ready: true, date: '2026-08-04T11:45:00+08:00', dimensions: [94, 92, 86, 88, 95, 93, 90], issues: [] }),
  makeSnapshot({ id: 'SNAP_012', modelId: 'NPC_B', modelName: 'NPC Character B', version: 'v1.1', generator: 'TopoGen B', target: realtime, asset: character, score: 83.8, ready: true, date: '2026-08-06T16:30:00+08:00', dimensions: [87, 85, 79, 80, 89, 86, 82], issues: ['POLE'] }),
])
