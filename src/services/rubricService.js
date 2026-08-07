import { getAssetType } from '../config/evaluation/assetTypes.js'
import { getPlatformProfile } from '../config/evaluation/platformProfiles.js'
import { getProductionTarget } from '../config/evaluation/productionTargets.js'
import { specializedRuleModules } from '../config/evaluation/specializedRuleModules.js'
import {
  platformRuleModules,
  specializedRubricVersion,
  targetRuleProfiles,
} from '../config/evaluation/specializedRubricProfiles.js'

export function composeSpecializedRubric(context = {}) {
  const target = getProductionTarget(context.productionTargetId)
  const assetType = getAssetType(context.assetTypeId)
  const platform = getPlatformProfile(context.platformProfileId)

  if (!target || !assetType || !platform || !platform.targets.includes(target.id)) {
    return {
      ready: false,
      rubricVersion: specializedRubricVersion,
      moduleIds: [],
      rules: [],
      reason: '请先选择有效的生产流程、资产类型和目标平台。',
    }
  }

  const moduleIds = [
    ...(targetRuleProfiles[target.id] || []),
    assetType.ruleModuleId,
    platformRuleModules[platform.id],
  ].filter(Boolean)

  const seenRuleIds = new Set()
  const rules = moduleIds
    .flatMap((moduleId) => (specializedRuleModules[moduleId] || []).map((rule) => ({ ...rule, moduleId })))
    .filter((rule) => {
      if (seenRuleIds.has(rule.id)) return false
      seenRuleIds.add(rule.id)
      return true
    })

  return {
    ready: true,
    rubricVersion: specializedRubricVersion,
    profileId: `${target.id}__${assetType.id}__${platform.id}`,
    moduleIds,
    rules,
    context: {
      productionTargetId: target.id,
      assetTypeId: assetType.id,
      platformProfileId: platform.id,
    },
  }
}
