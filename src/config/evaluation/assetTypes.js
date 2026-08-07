export const assetTypes = Object.freeze([
  { id: 'character_creature', name: '角色与生物', description: '人物、动物、怪物及通常需要形变的主体。', ruleModuleId: 'ASSET_CHARACTER' },
  { id: 'prop_hard_surface', name: '道具与硬表面', description: '武器、机械、家具和一般硬表面资产。', ruleModuleId: 'ASSET_HARD_SURFACE' },
  { id: 'vehicle_product', name: '载具与产品', description: '汽车、设备和需要高质量曲面表现的产品。', ruleModuleId: 'ASSET_PRODUCT' },
  { id: 'environment_architecture', name: '场景与建筑', description: '建筑、地形、植物和环境组合资产。', ruleModuleId: 'ASSET_ENVIRONMENT' },
  { id: 'other', name: '其他或未分类', description: '暂时不属于固定类型，先使用生产流程通用规则。', ruleModuleId: null },
])

export const getAssetType = (id) => assetTypes.find((item) => item.id === id) || null
