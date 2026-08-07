import * as THREE from 'three'

const MAX_OVERLAY_TRIANGLES = 300000

const readVertex = (position, index, target) => {
  target.set(position.getX(index), position.getY(index), position.getZ(index))
  return target
}

const COLD_COLOR = new THREE.Color('#315efb')
const MIDDLE_COLOR = new THREE.Color('#43d3a2')
const HOT_COLOR = new THREE.Color('#ff5a5f')

const applyHeatColor = (value, target) => {
  if (value < 0.5) return target.copy(COLD_COLOR).lerp(MIDDLE_COLOR, value * 2)
  return target.copy(MIDDLE_COLOR).lerp(HOT_COLOR, (value - 0.5) * 2)
}

export function ensureDensityColors(geometry) {
  const position = geometry?.getAttribute('position')
  if (!position || geometry.getAttribute('viewerDensityColor')) return

  const index = geometry.getIndex()
  const triangleCount = Math.floor((index ? index.count : position.count) / 3)
  if (!triangleCount) return

  const areaSums = new Float64Array(position.count)
  const areaUses = new Uint32Array(position.count)
  const pointA = new THREE.Vector3()
  const pointB = new THREE.Vector3()
  const pointC = new THREE.Vector3()
  const edgeA = new THREE.Vector3()
  const edgeB = new THREE.Vector3()

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const offset = triangleIndex * 3
    const a = index ? index.getX(offset) : offset
    const b = index ? index.getX(offset + 1) : offset + 1
    const c = index ? index.getX(offset + 2) : offset + 2
    readVertex(position, a, pointA)
    readVertex(position, b, pointB)
    readVertex(position, c, pointC)
    edgeA.subVectors(pointB, pointA)
    edgeB.subVectors(pointC, pointA)
    const area = Math.max(edgeA.cross(edgeB).length() * 0.5, Number.EPSILON)
    ;[a, b, c].forEach((vertexIndex) => {
      areaSums[vertexIndex] += area
      areaUses[vertexIndex] += 1
    })
  }

  const averageAreas = Array.from(areaSums, (sum, vertexIndex) => (
    sum / Math.max(areaUses[vertexIndex], 1)
  ))
  const logAreas = averageAreas.map((area) => Math.log(Math.max(area, Number.EPSILON)))
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  logAreas.forEach((logArea) => {
    min = Math.min(min, logArea)
    max = Math.max(max, logArea)
  })
  const range = Math.max(max - min, Number.EPSILON)
  const colors = new Float32Array(position.count * 3)
  const densityColor = new THREE.Color()

  logAreas.forEach((logArea, vertexIndex) => {
    const density = 1 - (logArea - min) / range
    applyHeatColor(density, densityColor)
    colors[vertexIndex * 3] = densityColor.r
    colors[vertexIndex * 3 + 1] = densityColor.g
    colors[vertexIndex * 3 + 2] = densityColor.b
  })

  geometry.setAttribute('viewerDensityColor', new THREE.BufferAttribute(colors, 3))
}

function createLineSegments(positions, color) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const material = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.98 })
  const lines = new THREE.LineSegments(geometry, material)
  lines.renderOrder = 30
  lines.visible = false
  lines.userData.isViewerOverlay = true
  return lines
}

export function attachTopologyOverlays(mesh) {
  const geometry = mesh?.geometry
  const position = geometry?.getAttribute('position')
  if (!position || mesh.userData.viewerTopologyOverlays) return mesh.userData.viewerTopologyOverlays || null

  const index = geometry.getIndex()
  const triangleCount = Math.floor((index ? index.count : position.count) / 3)
  if (!triangleCount || triangleCount > MAX_OVERLAY_TRIANGLES) return null

  geometry.computeBoundingBox?.()
  const localSize = geometry.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3(1, 1, 1)
  const tolerance = Math.max(localSize.x, localSize.y, localSize.z, 1) * 1e-7
  const vertexKeys = Array.from({ length: position.count }, (_, vertexIndex) => {
    const x = Math.round(position.getX(vertexIndex) / tolerance)
    const y = Math.round(position.getY(vertexIndex) / tolerance)
    const z = Math.round(position.getZ(vertexIndex) / tolerance)
    return `${x},${y},${z}`
  })
  const edges = new Map()

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const offset = triangleIndex * 3
    const vertices = [
      index ? index.getX(offset) : offset,
      index ? index.getX(offset + 1) : offset + 1,
      index ? index.getX(offset + 2) : offset + 2,
    ]
    ;[[0, 1], [1, 2], [2, 0]].forEach(([startOffset, endOffset]) => {
      const startIndex = vertices[startOffset]
      const endIndex = vertices[endOffset]
      const startKey = vertexKeys[startIndex]
      const endKey = vertexKeys[endIndex]
      if (startKey === endKey) return
      const edgeKey = startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`
      const edge = edges.get(edgeKey)
      if (edge) edge.useCount += 1
      else edges.set(edgeKey, { useCount: 1, startIndex, endIndex })
    })
  }

  const boundaryPositions = []
  const nonManifoldPositions = []
  const startPoint = new THREE.Vector3()
  const endPoint = new THREE.Vector3()
  edges.forEach(({ useCount, startIndex, endIndex }) => {
    if (useCount !== 1 && useCount <= 2) return
    readVertex(position, startIndex, startPoint)
    readVertex(position, endIndex, endPoint)
    const target = useCount === 1 ? boundaryPositions : nonManifoldPositions
    target.push(startPoint.x, startPoint.y, startPoint.z, endPoint.x, endPoint.y, endPoint.z)
  })

  const overlays = {
    boundaries: createLineSegments(boundaryPositions, '#ff9b42'),
    nonManifold: createLineSegments(nonManifoldPositions, '#a96cff'),
  }
  mesh.add(overlays.boundaries)
  mesh.add(overlays.nonManifold)
  mesh.userData.viewerTopologyOverlays = overlays
  return overlays
}

export function disposeTopologyOverlays(mesh) {
  const overlays = mesh?.userData?.viewerTopologyOverlays
  if (!overlays) return
  Object.values(overlays).forEach((overlay) => {
    mesh.remove(overlay)
    overlay.geometry?.dispose()
    overlay.material?.dispose()
  })
  delete mesh.userData.viewerTopologyOverlays
}
