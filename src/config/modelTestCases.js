export const modelTestCases = Object.freeze([
  {
    id: 'BUILTIN_CLEAN_CUBE',
    name: '健康封闭网格',
    shortName: '健康模型',
    description: '封闭立方体，用于确认无非流形、重复面和零面积面时的自动结果。',
    url: '/models/topology-clean-cube.obj',
    format: 'obj',
    expected: '已测规则应全部通过，开放边数量为 0。',
    tone: 'success',
  },
  {
    id: 'BUILTIN_DIAGNOSTIC_MESH',
    name: '拓扑问题诊断网格',
    shortName: '问题模型',
    description: '包含非流形共边、重复面和零面积面，用于验证问题报告。',
    url: '/models/auto-evaluation-diagnostic.obj',
    format: 'obj',
    expected: '应生成非流形、重复面和零面积问题。',
    tone: 'warning',
  },
  {
    id: 'BUILTIN_OPEN_BOUNDARY',
    name: '开放边界测试网格',
    shortName: '开放边测试',
    description: '程序定义的开放平面，用于验证孔洞 / 开放边界计数与区域定位。',
    url: '/models/topology-open-boundary.obj',
    format: 'obj',
    expected: '应检测到 4 条开放边，并可定位到对应边界。',
    tone: 'warning',
  },
  {
    id: 'BUILTIN_SLIVER_TRIANGLE',
    name: '狭长三角面测试网格',
    shortName: '狭长面测试',
    description: '程序定义的极端狭长三角面，用于验证面质量检测与区域定位。',
    url: '/models/topology-sliver-triangle.obj',
    format: 'obj',
    expected: '应检测到狭长三角面，并保存可点击的面区域证据。',
    tone: 'warning',
  },
])

export const getModelTestCase = (id) => modelTestCases.find((item) => item.id === id) || null
