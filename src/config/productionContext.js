export { modelSources, getModelSource } from './evaluation/modelSources.js'
export { productionTargets, getProductionTarget } from './evaluation/productionTargets.js'
export { assetTypes, getAssetType } from './evaluation/assetTypes.js'
export {
  platformProfiles,
  getPlatformProfile,
  getPlatformProfilesForTarget,
} from './evaluation/platformProfiles.js'

export const pipelineStages = Object.freeze([
  { id: 'RETOPOLOGY_REVIEW', name: '拓扑完成后检查', description: '确认基础网格能否进入后续制作。' },
  { id: 'BEFORE_UV_BAKE', name: 'UV 与烘焙前', description: '准备展开 UV、投射和烘焙贴图。' },
  { id: 'BEFORE_RIG_ANIMATION', name: '绑定与动画前', description: '准备骨骼绑定、蒙皮和变形测试。' },
  { id: 'BEFORE_ENGINE_DELIVERY', name: '引擎或应用导入前', description: '准备进入目标平台并进行性能验证。' },
  { id: 'FINAL_DELIVERY', name: '最终交付前', description: '执行交付门槛与文件完整性检查。' },
])

export const defaultProductionContext = Object.freeze({
  modelSourceId: null,
  productionTargetId: null,
  assetTypeId: null,
  platformProfileId: null,
  pipelineStageId: null,
})

export const getPipelineStage = (id) => pipelineStages.find((item) => item.id === id) || null

const legacyTargetIds = Object.freeze({
  REALTIME_GAME: 'TARGET_REALTIME',
  ANIMATION_FILM: 'TARGET_ANIMATION',
  VISUALIZATION: 'TARGET_VIS',
  PRINTING: 'TARGET_ENGINEERING',
})

const legacyAssetTypeIds = Object.freeze({
  CHARACTER_CREATURE: 'character_creature',
  PROP_HARD_SURFACE: 'prop_hard_surface',
  ENVIRONMENT: 'environment_architecture',
  OTHER: 'other',
})

export function normalizeProductionContext(context = {}) {
  const legacyTargetId = context.productionTargetId || context.targetId || null
  const productionTargetId = legacyTargetIds[legacyTargetId] || legacyTargetId
  const legacyAssetTypeId = context.assetTypeId || null
  const assetTypeId = legacyAssetTypeIds[legacyAssetTypeId] || legacyAssetTypeId
  const inheritedPrintingPlatform = context.targetId === 'PRINTING' ? '3d-print' : null

  return {
    ...defaultProductionContext,
    modelSourceId: context.modelSourceId || null,
    productionTargetId,
    assetTypeId,
    platformProfileId: context.platformProfileId || inheritedPrintingPlatform,
    pipelineStageId: context.pipelineStageId || null,
  }
}
