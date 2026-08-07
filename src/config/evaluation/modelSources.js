export const modelSources = Object.freeze([
  { id: 'MANUAL_MODEL', name: '人工建模', description: '由模型师手工建模或手工重拓扑。' },
  { id: 'DIGITAL_SCULPT', name: '数字雕刻', description: '来自 ZBrush 等数字雕刻流程。' },
  { id: 'AI_GENERATED', name: 'AI 生成', description: '由 AI 生成或 AI 自动重拓扑。' },
  { id: 'SCAN', name: '扫描重建', description: '来自摄影测量、激光或实物扫描。' },
  { id: 'CAD', name: 'CAD', description: '来自工业设计或参数化 CAD 数据。' },
  { id: 'BIM', name: 'BIM', description: '来自建筑信息模型数据。' },
  { id: 'RECONSTRUCTION', name: '其他重建', description: '来自算法重建或其他自动化流程。' },
])

export const getModelSource = (id) => modelSources.find((item) => item.id === id) || null
