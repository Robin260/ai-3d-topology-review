export const productionTargets = Object.freeze([
  {
    id: 'TARGET_REALTIME',
    name: '实时交互',
    shortName: '实时',
    description: '游戏、Web、VR、AR 等实时运行内容。',
    focusAreas: ['性能预算', 'LOD', 'UV 与烘焙', '引擎法线'],
  },
  {
    id: 'TARGET_ANIMATION',
    name: '动画制作',
    shortName: '动画',
    description: '绑定、蒙皮、表情、动作与变形制作。',
    focusAreas: ['边流', '关节环线', '面部环线', '变形适配'],
  },
  {
    id: 'TARGET_VIS',
    name: '展示与可视化',
    shortName: '可视化',
    description: '产品、汽车、建筑与高质量视觉展示。',
    focusAreas: ['轮廓精度', '表面连续性', '材质展示', '渲染法线'],
  },
  {
    id: 'TARGET_ENGINEERING',
    name: '工程与实体输出',
    shortName: '工程',
    description: 'CAD、BIM、3D 打印、医疗与制造场景。',
    focusAreas: ['封闭性', '真实尺度', '最小厚度', '工程完整性'],
  },
  {
    id: 'TARGET_DIGITAL_TWIN',
    name: '数字孪生',
    shortName: '数字孪生',
    description: '城市、工厂、GIS 与超大规模场景。',
    focusAreas: ['分层组织', '坐标尺度', '流式加载', '多级 LOD'],
  },
])

export const getProductionTarget = (id) => productionTargets.find((item) => item.id === id) || null
