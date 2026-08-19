const streetLampBaseUrl = '/models/test-cases/street-lamp'

export const streetLampTestGroup = Object.freeze({
  id: 'SCENE_STREET_LAMP_V1',
  name: '场景模型 · 街道路灯',
  description: '同一类街道路灯的人工修复版本与腾讯混元 AI 自动生成版本。',
  productionTarget: '游戏实时资产',
  assetType: '场景道具 / 硬表面',
  baseline: {
    id: 'STREET_LAMP_FIXED_GOOD',
    name: 'Scene_StreetLamp_FIXED_GOOD.fbx',
    shortName: 'FIXED · 人工修复参考',
    url: `${streetLampBaseUrl}/Scene_StreetLamp_FIXED_GOOD.fbx`,
    format: 'fbx',
    role: 'REFERENCE_BASELINE',
    sourceTypeId: 'AI_REPAIRED',
  },
  candidates: [1, 2, 3, 4, 5].map((index) => ({
    id: `STREET_LAMP_AUTO_${index}`,
    name: `Scene_StreetLamp_AUTO_${index}.fbx`,
    shortName: `AUTO ${index} · 腾讯混元 AI`,
    url: `${streetLampBaseUrl}/Scene_StreetLamp_AUTO_${index}.fbx`,
    format: 'fbx',
    role: 'AI_CANDIDATE',
    sourceTypeId: 'AI_GENERATED',
  })),
  specializedPreset: {
    productionTargetId: 'TARGET_REALTIME',
    assetTypeId: 'prop_hard_surface',
    platformProfileId: 'unspecified',
    pipelineStageId: 'BEFORE_ENGINE_DELIVERY',
  },
})

export default streetLampTestGroup
