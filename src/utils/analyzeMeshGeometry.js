import * as THREE from 'three'

const AREA_EPSILON = 1e-12
const NORMAL_EPSILON = 1e-10
const SLIVER_QUALITY_THRESHOLD = 0.025
const MAX_TOPOLOGY_TRIANGLES_PER_MESH = 300000
const MAX_ISSUE_REGIONS_PER_TYPE = 200

const readVertex = (position, index, target) => {
  target.set(position.getX(index), position.getY(index), position.getZ(index))
  return target
}

export function analyzeMeshGeometry(root) {
  const summary = {
    meshCount: 0,
    vertexCount: 0,
    triangleCount: 0,
    indexedMeshCount: 0,
    degenerateTriangleCount: 0,
    nearDegenerateTriangleCount: 0,
    sliverTriangleCount: 0,
    minimumTriangleQuality: 1,
    duplicateFaceCount: 0,
    duplicatePositionCount: 0,
    boundaryEdgeCount: 0,
    nonManifoldEdgeCount: 0,
    nonManifoldVertexCount: 0,
    topologyAnalyzedTriangleCount: 0,
    topologySkippedTriangleCount: 0,
    missingNormalMeshCount: 0,
    invalidNormalCount: 0,
    uvMeshCount: 0,
    missingUvMeshCount: 0,
    materialSlotCount: 0,
    dimensions: { x: 0, y: 0, z: 0 },
    issueRegions: {
      nonManifoldEdges: [],
      boundaryEdges: [],
      duplicateFaces: [],
      degenerateFaces: [],
      nearDegenerateFaces: [],
      sliverFaces: [],
      invalidNormals: [],
    },
  }

  if (!root?.traverse) return summary

  const pointA = new THREE.Vector3()
  const pointB = new THREE.Vector3()
  const pointC = new THREE.Vector3()
  const edgeVectorA = new THREE.Vector3()
  const edgeVectorB = new THREE.Vector3()
  const worldPointA = new THREE.Vector3()
  const worldPointB = new THREE.Vector3()
  const worldPointC = new THREE.Vector3()

  const addIssueRegion = (type, region) => {
    if (summary.issueRegions[type].length < MAX_ISSUE_REGIONS_PER_TYPE) {
      summary.issueRegions[type].push(region)
    }
  }

  root.updateMatrixWorld?.(true)
  root.traverse((object) => {
    if (!object.isMesh || !object.geometry) return
    const geometry = object.geometry
    const position = geometry.getAttribute('position')
    if (!position) return
    const objectName = object.name || `Mesh_${summary.meshCount + 1}`

    summary.meshCount += 1
    summary.vertexCount += position.count

    const index = geometry.getIndex()
    const elementCount = index ? index.count : position.count
    const triangleCount = Math.floor(elementCount / 3)
    summary.triangleCount += triangleCount
    if (index) summary.indexedMeshCount += 1

    const uv = geometry.getAttribute('uv')
    if (uv) summary.uvMeshCount += 1
    else summary.missingUvMeshCount += 1
    summary.materialSlotCount += Array.isArray(object.material) ? object.material.length : (object.material ? 1 : 0)

    geometry.computeBoundingBox?.()
    const localSize = geometry.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3(1, 1, 1)
    const quantizeTolerance = Math.max(localSize.x, localSize.y, localSize.z, 1) * 1e-7
    const vertexKeys = Array.from({ length: position.count }, (_, vertexIndex) => {
      const x = Math.round(position.getX(vertexIndex) / quantizeTolerance)
      const y = Math.round(position.getY(vertexIndex) / quantizeTolerance)
      const z = Math.round(position.getZ(vertexIndex) / quantizeTolerance)
      return `${x},${y},${z}`
    })
    const vertexIndexByKey = new Map()
    vertexKeys.forEach((key, vertexIndex) => {
      if (!vertexIndexByKey.has(key)) vertexIndexByKey.set(key, vertexIndex)
    })
    summary.duplicatePositionCount += position.count - new Set(vertexKeys).size

    const shouldAnalyzeTopology = triangleCount <= MAX_TOPOLOGY_TRIANGLES_PER_MESH
    const edgeUseCount = shouldAnalyzeTopology ? new Map() : null
    const faceUseCount = shouldAnalyzeTopology ? new Map() : null
    if (shouldAnalyzeTopology) summary.topologyAnalyzedTriangleCount += triangleCount
    else summary.topologySkippedTriangleCount += triangleCount

    for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
      const offset = triangleIndex * 3
      const a = index ? index.getX(offset) : offset
      const b = index ? index.getX(offset + 1) : offset + 1
      const c = index ? index.getX(offset + 2) : offset + 2
      readVertex(position, a, pointA)
      readVertex(position, b, pointB)
      readVertex(position, c, pointC)
      const abSquared = pointA.distanceToSquared(pointB)
      const bcSquared = pointB.distanceToSquared(pointC)
      const caSquared = pointC.distanceToSquared(pointA)
      edgeVectorA.subVectors(pointB, pointA)
      edgeVectorB.subVectors(pointC, pointA)
      const doubleAreaSquared = edgeVectorA.cross(edgeVectorB).lengthSq()
      const maximumEdgeSquared = Math.max(abSquared, bcSquared, caSquared)
      const scaledAreaEpsilon = Math.max(AREA_EPSILON, maximumEdgeSquared * maximumEdgeSquared * 1e-12)

      if (doubleAreaSquared === 0) {
        summary.degenerateTriangleCount += 1
        summary.minimumTriangleQuality = 0
        worldPointA.copy(pointA).applyMatrix4(object.matrixWorld)
        worldPointB.copy(pointB).applyMatrix4(object.matrixWorld)
        worldPointC.copy(pointC).applyMatrix4(object.matrixWorld)
        addIssueRegion('degenerateFaces', {
          objectName,
          triangleIndex,
          vertexIndices: [a, b, c],
          points: [worldPointA.toArray(), worldPointB.toArray(), worldPointC.toArray()],
          center: worldPointA.clone().add(worldPointB).add(worldPointC).multiplyScalar(1 / 3).toArray(),
        })
      } else {
        const doubleArea = Math.sqrt(doubleAreaSquared)
        const quality = 2 * Math.sqrt(3) * doubleArea / Math.max(abSquared + bcSquared + caSquared, Number.EPSILON)
        summary.minimumTriangleQuality = Math.min(summary.minimumTriangleQuality, quality)
        if (doubleAreaSquared <= scaledAreaEpsilon) {
          summary.nearDegenerateTriangleCount += 1
          worldPointA.copy(pointA).applyMatrix4(object.matrixWorld)
          worldPointB.copy(pointB).applyMatrix4(object.matrixWorld)
          worldPointC.copy(pointC).applyMatrix4(object.matrixWorld)
          addIssueRegion('nearDegenerateFaces', {
            objectName,
            triangleIndex,
            vertexIndices: [a, b, c],
            points: [worldPointA.toArray(), worldPointB.toArray(), worldPointC.toArray()],
            center: worldPointA.clone().add(worldPointB).add(worldPointC).multiplyScalar(1 / 3).toArray(),
            quality,
          })
        } else if (quality < SLIVER_QUALITY_THRESHOLD) {
          summary.sliverTriangleCount += 1
          worldPointA.copy(pointA).applyMatrix4(object.matrixWorld)
          worldPointB.copy(pointB).applyMatrix4(object.matrixWorld)
          worldPointC.copy(pointC).applyMatrix4(object.matrixWorld)
          addIssueRegion('sliverFaces', {
            objectName,
            triangleIndex,
            vertexIndices: [a, b, c],
            points: [worldPointA.toArray(), worldPointB.toArray(), worldPointC.toArray()],
            center: worldPointA.clone().add(worldPointB).add(worldPointC).multiplyScalar(1 / 3).toArray(),
            quality,
          })
        }
      }

      if (shouldAnalyzeTopology) {
        const triangleVertices = [vertexKeys[a], vertexKeys[b], vertexKeys[c]]
        const faceKey = [...triangleVertices].sort().join('|')
        const previousFaceUse = faceUseCount.get(faceKey) || 0
        if (previousFaceUse > 0) {
          summary.duplicateFaceCount += 1
          worldPointA.copy(pointA).applyMatrix4(object.matrixWorld)
          worldPointB.copy(pointB).applyMatrix4(object.matrixWorld)
          worldPointC.copy(pointC).applyMatrix4(object.matrixWorld)
          addIssueRegion('duplicateFaces', {
            objectName,
            triangleIndex,
            vertexIndices: [a, b, c],
            points: [worldPointA.toArray(), worldPointB.toArray(), worldPointC.toArray()],
            center: worldPointA.clone().add(worldPointB).add(worldPointC).multiplyScalar(1 / 3).toArray(),
          })
        }
        faceUseCount.set(faceKey, previousFaceUse + 1)

        const triangleEdges = [
          [triangleVertices[0], triangleVertices[1]],
          [triangleVertices[1], triangleVertices[2]],
          [triangleVertices[2], triangleVertices[0]],
        ]
        triangleEdges.forEach(([start, end]) => {
          if (start === end) return
          const edgeKey = start < end ? `${start}|${end}` : `${end}|${start}`
          const edge = edgeUseCount.get(edgeKey)
          if (edge) edge.useCount += 1
          else edgeUseCount.set(edgeKey, { useCount: 1, startKey: start, endKey: end })
        })
      }
    }

    if (shouldAnalyzeTopology) {
      const nonManifoldVertices = new Set()
      edgeUseCount.forEach((edge, edgeKey) => {
        const startIndex = vertexIndexByKey.get(edge.startKey)
        const endIndex = vertexIndexByKey.get(edge.endKey)
        readVertex(position, startIndex, worldPointA).applyMatrix4(object.matrixWorld)
        readVertex(position, endIndex, worldPointB).applyMatrix4(object.matrixWorld)
        const region = {
          objectName,
          edgeKey,
          vertexIndices: [startIndex, endIndex],
          start: worldPointA.toArray(),
          end: worldPointB.toArray(),
          center: worldPointA.clone().add(worldPointB).multiplyScalar(0.5).toArray(),
          useCount: edge.useCount,
        }
        if (edge.useCount === 1) {
          summary.boundaryEdgeCount += 1
          addIssueRegion('boundaryEdges', region)
        }
        if (edge.useCount <= 2) return
        summary.nonManifoldEdgeCount += 1
        addIssueRegion('nonManifoldEdges', region)
        edgeKey.split('|').forEach((vertexKey) => nonManifoldVertices.add(vertexKey))
      })
      summary.nonManifoldVertexCount += nonManifoldVertices.size
    }

    const normal = geometry.getAttribute('normal')
    if (!normal) {
      summary.missingNormalMeshCount += 1
    } else {
      for (let normalIndex = 0; normalIndex < normal.count; normalIndex += 1) {
        const x = normal.getX(normalIndex)
        const y = normal.getY(normalIndex)
        const z = normal.getZ(normalIndex)
        const lengthSquared = x * x + y * y + z * z
        if (!Number.isFinite(lengthSquared) || lengthSquared <= NORMAL_EPSILON) {
          summary.invalidNormalCount += 1
          if (normalIndex < position.count) {
            readVertex(position, normalIndex, worldPointA).applyMatrix4(object.matrixWorld)
            addIssueRegion('invalidNormals', {
              objectName,
              vertexIndex: normalIndex,
              center: worldPointA.toArray(),
            })
          }
        }
      }
    }
  })

  const bounds = new THREE.Box3().setFromObject(root)
  if (!bounds.isEmpty()) {
    const size = bounds.getSize(new THREE.Vector3())
    summary.dimensions = { x: size.x, y: size.y, z: size.z }
  }

  summary.topologyAnalysisComplete = summary.triangleCount > 0 && summary.topologySkippedTriangleCount === 0
  summary.degenerateTriangleRatio = summary.triangleCount ? summary.degenerateTriangleCount / summary.triangleCount : 0
  summary.nearDegenerateTriangleRatio = summary.triangleCount ? summary.nearDegenerateTriangleCount / summary.triangleCount : 0
  summary.sliverTriangleRatio = summary.triangleCount ? summary.sliverTriangleCount / summary.triangleCount : 0
  summary.analysisVersion = 'LOCAL_GEOMETRY_ANALYSIS_V3'
  summary.issueRegionLimit = MAX_ISSUE_REGIONS_PER_TYPE

  return summary
}

export default analyzeMeshGeometry
