export const platformProfiles = Object.freeze([
  { id: 'mobile', name: '移动端', description: '手机与平板实时运行。', targets: ['TARGET_REALTIME'] },
  { id: 'web', name: 'Web', description: '浏览器和在线 3D 内容。', targets: ['TARGET_REALTIME', 'TARGET_VIS', 'TARGET_DIGITAL_TWIN'] },
  { id: 'pc', name: 'PC', description: '桌面实时、制作或工程环境。', targets: ['TARGET_REALTIME', 'TARGET_ANIMATION', 'TARGET_VIS', 'TARGET_ENGINEERING', 'TARGET_DIGITAL_TWIN'] },
  { id: 'console', name: '主机', description: '主机平台实时内容。', targets: ['TARGET_REALTIME'] },
  { id: 'vr', name: 'VR', description: '虚拟现实与沉浸式体验。', targets: ['TARGET_REALTIME', 'TARGET_VIS', 'TARGET_DIGITAL_TWIN'] },
  { id: 'ar', name: 'AR', description: '增强现实和空间计算。', targets: ['TARGET_REALTIME', 'TARGET_VIS', 'TARGET_DIGITAL_TWIN'] },
  { id: 'offline-render', name: '离线渲染', description: '产品、建筑或高质量离线画面。', targets: ['TARGET_ANIMATION', 'TARGET_VIS'] },
  { id: 'film-render', name: '影视渲染', description: '影视动画镜头与高精度变形。', targets: ['TARGET_ANIMATION'] },
  { id: '3d-print', name: '3D 打印', description: '切片、制造与实体输出。', targets: ['TARGET_ENGINEERING'] },
  { id: 'unspecified', name: '暂未指定', description: '先建立专项上下文，稍后补充具体平台。', targets: ['TARGET_REALTIME', 'TARGET_ANIMATION', 'TARGET_VIS', 'TARGET_ENGINEERING', 'TARGET_DIGITAL_TWIN'] },
])

export const getPlatformProfile = (id) => platformProfiles.find((item) => item.id === id) || null

export const getPlatformProfilesForTarget = (targetId) => (
  platformProfiles.filter((item) => item.targets.includes(targetId))
)
