const createRule = (id, name, category, description, method = 'MANUAL', implementationStatus = 'NOT_IMPLEMENTED') => ({
  id,
  name,
  category,
  description,
  source: 'SPECIALIZED_NEW',
  method,
  implementationStatus,
})

const reusedRule = (id, name, category, description) => ({
  id,
  name,
  category,
  description,
  source: 'UNIVERSAL_REUSED',
  method: 'REUSE_RESULT',
  implementationStatus: 'REUSED_RESULT',
})

export const specializedRuleModules = Object.freeze({
  UNIVERSAL_BRIDGE: [
    reusedRule('UNIVERSAL_MESH_HEALTH', '网格健康结果', '通用结果复用', '复用通用层的非流形、破面和异常几何结论，不重复扣分。'),
    reusedRule('UNIVERSAL_SILHOUETTE', '轮廓保持结果', '通用结果复用', '复用通用层的整体与局部轮廓结果。'),
    reusedRule('UNIVERSAL_NORMAL_BASE', '基础法线结果', '通用结果复用', '复用通用层的基础法线与表面连续性结果。'),
  ],
  TARGET_REALTIME: [
    createRule('RT_PERFORMANCE_BUDGET', '实时性能预算', '性能', '检查模型是否符合目标平台的三角面与绘制成本预算。', 'HYBRID', 'DEMO_CONFIG'),
    createRule('RT_LOD_STRATEGY', 'LOD 完整性与过渡', 'LOD', '检查实时资产是否具备合理的多级细节方案。'),
    createRule('RT_UV_BAKE', 'UV 与烘焙适配', 'UV / 烘焙', '检查 UV、烘焙边界和低模承接高模细节的能力。'),
    createRule('RT_ENGINE_NORMALS', '引擎法线表现', '法线', '检查加权法线、硬边与切线空间的引擎适配。'),
  ],
  TARGET_ANIMATION: [
    createRule('ANIM_EDGE_FLOW', '动画边流', '变形', '在通用边流基础上，提高对肌肉和动作方向的要求。'),
    createRule('ANIM_JOINT_LOOPS', '关节环线', '变形', '检查肩、肘、膝等关键关节的支撑环线。'),
    createRule('ANIM_FACE_LOOPS', '面部表情环线', '面部', '检查眼、口、鼻与表情变形区域的环线结构。'),
    createRule('ANIM_DEFORMATION_TEST', '基础变形测试', '变形', '通过典型姿态检查拉伸、塌陷、穿插与翻面。'),
  ],
  TARGET_VIS: [
    createRule('VIS_SURFACE_CONTINUITY', '高质量表面连续性', '视觉质量', '检查产品与曲面资产在近景中的高光连续性。'),
    createRule('VIS_MATERIAL_PRESENTATION', '材质展示适配', '材质', '检查材质分区、UV 与展示镜头的匹配程度。'),
    createRule('VIS_RENDER_NORMALS', '渲染法线质量', '法线', '检查近景渲染中的阴影、倒角与曲面法线。'),
  ],
  TARGET_ENGINEERING: [
    createRule('ENG_WATERTIGHT', '可制造封闭性', '工程完整性', '在网格健康基础上检查切片或工程输出所需的封闭体。', 'AUTOMATIC', 'DEMO_CONFIG'),
    createRule('ENG_SCALE_UNITS', '单位与真实尺寸', '工程规范', '检查单位、比例和尺寸是否符合交付要求。'),
    createRule('ENG_MIN_THICKNESS', '最小壁厚', '实体输出', '检查薄壁、悬空和无法制造的局部结构。'),
  ],
  TARGET_DIGITAL_TWIN: [
    createRule('DT_HIERARCHY', '场景分层与对象组织', '场景管理', '检查城市、工厂等大型数据的层级与拆分方式。'),
    createRule('DT_COORDINATES', '坐标与尺度一致性', '场景管理', '检查大世界坐标、原点与实际尺度。'),
    createRule('DT_STREAMING_LOD', '流式加载与多级 LOD', '性能', '检查大规模场景的分块、流式加载和 LOD 策略。'),
  ],
  ASSET_CHARACTER: [
    createRule('ASSET_CHARACTER_DEFORMATION', '角色关键变形区', '资产类型', '针对角色与生物加强关节、面部和高运动区域检查。'),
  ],
  ASSET_HARD_SURFACE: [
    createRule('ASSET_HARD_SURFACE_SHADING', '硬表面转折与阴影', '资产类型', '检查硬边、倒角、极点和高光转折是否稳定。'),
  ],
  ASSET_PRODUCT: [
    createRule('ASSET_PRODUCT_CURVATURE', '产品曲率与轮廓', '资产类型', '检查产品和载具的曲率连续性与品牌特征轮廓。'),
  ],
  ASSET_ENVIRONMENT: [
    createRule('ASSET_ENVIRONMENT_DENSITY', '场景资源分配', '资产类型', '检查大型场景中的面密度、可见距离与模块化复用。'),
  ],
  PLATFORM_MOBILE: [createRule('PLATFORM_MOBILE_BUDGET', '移动端预算档案', '平台', '调用移动端性能、材质和 LOD 限制；具体阈值等待项目档案确认。')],
  PLATFORM_WEB: [createRule('PLATFORM_WEB_BUDGET', 'Web 传输与运行预算', '平台', '检查下载体积、浏览器性能和渐进加载需求。')],
  PLATFORM_PC: [createRule('PLATFORM_PC_PROFILE', 'PC 平台档案', '平台', '调用 PC 端对应的质量和性能档案。')],
  PLATFORM_CONSOLE: [createRule('PLATFORM_CONSOLE_PROFILE', '主机平台档案', '平台', '调用主机平台对应的预算和交付规范。')],
  PLATFORM_VR: [createRule('PLATFORM_VR_BUDGET', 'VR 双目性能预算', '平台', '检查高帧率、双目渲染和近距离观看风险。')],
  PLATFORM_AR: [createRule('PLATFORM_AR_BUDGET', 'AR 轻量化预算', '平台', '检查移动设备性能、真实尺度和空间展示需求。')],
  PLATFORM_OFFLINE_RENDER: [createRule('PLATFORM_OFFLINE_RENDER_PROFILE', '离线渲染档案', '平台', '检查近景表面和渲染流程适配。')],
  PLATFORM_FILM_RENDER: [createRule('PLATFORM_FILM_RENDER_PROFILE', '影视渲染档案', '平台', '检查镜头级细节、变形和渲染要求。')],
  PLATFORM_3D_PRINT: [createRule('PLATFORM_3D_PRINT_PROFILE', '3D 打印档案', '平台', '检查切片、壁厚、封闭性和实体输出。')],
  PLATFORM_UNSPECIFIED: [createRule('PLATFORM_UNSPECIFIED_NOTICE', '平台预算待确认', '平台', '暂不应用具体平台阈值，报告中提示补充平台。', 'MANUAL', 'NOT_IMPLEMENTED')],
})
