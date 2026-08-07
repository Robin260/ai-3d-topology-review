import { composeSpecializedRubric } from '../src/services/rubricService.js'

const realtimeCharacterMobile = composeSpecializedRubric({
  productionTargetId: 'TARGET_REALTIME',
  assetTypeId: 'character_creature',
  platformProfileId: 'mobile',
})

const animationCharacterFilm = composeSpecializedRubric({
  productionTargetId: 'TARGET_ANIMATION',
  assetTypeId: 'character_creature',
  platformProfileId: 'film-render',
})

if (!realtimeCharacterMobile.ready || !animationCharacterFilm.ready) {
  throw new Error('有效上下文未能组合专项规则。')
}

if (realtimeCharacterMobile.profileId === animationCharacterFilm.profileId) {
  throw new Error('不同生产上下文生成了相同的专项档案。')
}

if (!realtimeCharacterMobile.rules.some((rule) => rule.source === 'UNIVERSAL_REUSED')) {
  throw new Error('专项规则没有复用通用评测结果。')
}

if (realtimeCharacterMobile.rules.length !== new Set(realtimeCharacterMobile.rules.map((rule) => rule.id)).size) {
  throw new Error('专项规则组合中存在重复规则。')
}

console.log(`专项规则组合验证通过：实时移动端 ${realtimeCharacterMobile.rules.length} 条，动画影视 ${animationCharacterFilm.rules.length} 条。`)
