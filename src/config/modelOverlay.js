export const overlaySections = [
  {
    id: 'visual',
    label: 'Overlay 可视化',
    items: [
      { id: 'wireframe', label: 'Wireframe 布线', color: '#62d9ff', capability: 'REAL' },
      { id: 'density', label: 'Heat Map 面密度热力图', color: '#ff6b6b', capability: 'REAL', exclusiveGroup: 'surface' },
    ],
  },
  {
    id: 'problems',
    label: '问题图层 Problem Overlay',
    items: [
      { id: 'poles', label: 'Pole 极点', color: '#73a8ff', capability: 'SOURCE_TOPOLOGY' },
      { id: 'triangles', label: 'Triangle 三角面', color: '#ef5c6c', capability: 'SOURCE_TOPOLOGY' },
      { id: 'ngons', label: 'N-Gon', color: '#f4cc46', capability: 'SOURCE_TOPOLOGY' },
      { id: 'nonManifold', label: 'Non-Manifold', color: '#a96cff', capability: 'REAL', countField: 'nonManifoldEdgeCount' },
      { id: 'boundaries', label: '孔洞 / 开放边界', color: '#ff9b42', capability: 'REAL', countField: 'boundaryEdgeCount' },
      { id: 'duplicateFaces', label: '重复面', color: '#ef5c6c', capability: 'REAL', countField: 'duplicateFaceCount' },
      { id: 'degenerateFaces', label: '真正零面积面', color: '#ff477e', capability: 'REAL', countField: 'degenerateTriangleCount' },
      { id: 'nearDegenerateFaces', label: '近退化三角面', color: '#ff7a45', capability: 'REAL', countField: 'nearDegenerateTriangleCount' },
      { id: 'sliverFaces', label: '狭长三角面', color: '#f4cc46', capability: 'REAL', countField: 'sliverTriangleCount' },
      { id: 'normals', label: '法线 Normal', color: '#ef6b83', capability: 'REAL', exclusiveGroup: 'surface' },
      { id: 'uvStretch', label: 'UV Stretch', color: '#ffad32', capability: 'UV_REQUIRED' },
    ],
  },
]

export const createDefaultOverlayState = () => Object.fromEntries(
  overlaySections.flatMap((section) => section.items).map((item) => [item.id, false]),
)

export const overlayCapabilityLabels = {
  REAL: '真实可用',
  SOURCE_TOPOLOGY: '需要源拓扑',
  UV_REQUIRED: '待接入 UV 分析',
}
