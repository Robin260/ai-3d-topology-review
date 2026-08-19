import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import ErrorNotice from '../ui/ErrorNotice.jsx'
import analyzeMeshGeometry from '../../utils/analyzeMeshGeometry.js'
import { createDefaultOverlayState } from '../../config/modelOverlay.js'
import { attachTopologyOverlays, disposeTopologyOverlays, ensureDensityColors } from '../../utils/createMeshOverlays.js'
import OverlayPanel from './OverlayPanel.jsx'
import './ModelViewer.css'

const CAMERA_POSITION = [4.4, 2.8, 5.2]

function CameraController({ resetToken, cameraState, onCameraChange, focusTarget }) {
  const { camera, gl } = useThree()
  const controls = useRef(null)
  const applyingExternal = useRef(false)

  useEffect(() => {
    const orbitControls = new OrbitControls(camera, gl.domElement)
    orbitControls.enableDamping = true
    orbitControls.dampingFactor = 0.075
    orbitControls.minDistance = 2.4
    orbitControls.maxDistance = 12
    camera.position.set(...CAMERA_POSITION)
    camera.up.set(0, 1, 0)
    camera.fov = 38
    camera.updateProjectionMatrix()
    orbitControls.target.set(0, 0.25, 0)
    orbitControls.update()
    orbitControls.saveState()
    controls.current = orbitControls

    const publishCamera = () => {
      if (applyingExternal.current) return
      onCameraChange?.({
        position: camera.position.toArray(),
        target: orbitControls.target.toArray(),
        up: camera.up.toArray(),
        zoom: camera.zoom,
      })
    }
    orbitControls.addEventListener('change', publishCamera)

    return () => {
      orbitControls.removeEventListener('change', publishCamera)
      orbitControls.dispose()
    }
  }, [camera, gl, onCameraChange])

  useEffect(() => {
    if (!cameraState || !controls.current) return
    applyingExternal.current = true
    camera.position.fromArray(cameraState.position)
    camera.up.fromArray(cameraState.up || [0, 1, 0])
    camera.zoom = cameraState.zoom || 1
    camera.updateProjectionMatrix()
    controls.current.target.fromArray(cameraState.target)
    controls.current.update()
    applyingExternal.current = false
  }, [camera, cameraState])

  useEffect(() => {
    if (!focusTarget?.point || !controls.current) return
    const target = new THREE.Vector3().fromArray(focusTarget.point)
    const offset = camera.position.clone().sub(controls.current.target)
    const distance = Math.max(offset.length(), 2.4)
    if (offset.lengthSq() < Number.EPSILON) offset.set(1, 0.65, 1)
    offset.setLength(distance)
    applyingExternal.current = true
    controls.current.target.copy(target)
    camera.position.copy(target).add(offset)
    controls.current.update()
    applyingExternal.current = false
    onCameraChange?.({
      position: camera.position.toArray(),
      target: controls.current.target.toArray(),
      up: camera.up.toArray(),
      zoom: camera.zoom,
    })
  }, [camera, focusTarget, onCameraChange])

  useEffect(() => {
    if (resetToken > 0) controls.current?.reset()
  }, [resetToken])

  useFrame(() => controls.current?.update())
  return null
}

function DemoGeometry({ wireframe }) {
  const group = useRef(null)

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.08
  })

  const materialProps = {
    color: '#7fa9db',
    roughness: 0.66,
    metalness: 0.06,
    wireframe,
  }

  return (
    <group ref={group} position={[0, -0.15, 0]} rotation={[0.04, -0.5, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[1.22, 2]} />
        <meshStandardMaterial {...materialProps} flatShading />
      </mesh>
      <mesh position={[0, -0.82, 0]} scale={[0.84, 1.1, 0.7]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial {...materialProps} color="#668fbe" flatShading />
      </mesh>
      <mesh position={[-0.92, 0.52, 0.5]} rotation={[0.2, 0.1, 0.4]} castShadow>
        <coneGeometry args={[0.21, 0.68, 5]} />
        <meshStandardMaterial {...materialProps} color="#9abce2" flatShading />
      </mesh>
      <mesh position={[0.92, 0.52, 0.5]} rotation={[0.2, -0.1, -0.4]} castShadow>
        <coneGeometry args={[0.21, 0.68, 5]} />
        <meshStandardMaterial {...materialProps} color="#9abce2" flatShading />
      </mesh>
    </group>
  )
}

const createLoader = (format) => {
  if (format === 'obj') return new OBJLoader()
  if (format === 'fbx') return new FBXLoader()
  return new GLTFLoader()
}

const inferFormat = (source, explicitFormat) => {
  if (explicitFormat) return explicitFormat.toLowerCase().replace('.', '')
  const cleanSource = String(source || '').split('?')[0].split('#')[0]
  return cleanSource.split('.').pop()?.toLowerCase() || 'glb'
}

function LoadedScene({ source, format, overlayState, onLoad, onError, onLoadingChange }) {
  const [scene, setScene] = useState(null)

  useEffect(() => {
    if (!source) return undefined

    let disposed = false
    let preparedScene = null
    const resolvedFormat = inferFormat(source, format)
    const loader = createLoader(resolvedFormat)
    setScene(null)
    onLoadingChange(true)

    loader.load(
      source,
      (result) => {
        if (disposed) return
        const loadedObject = result.scene || result
        const analysis = analyzeMeshGeometry(loadedObject)
        preparedScene = loadedObject.clone(true)

        preparedScene.traverse((object) => {
          if (!object.isMesh) return
          object.castShadow = true
          object.receiveShadow = true
          object.material = Array.isArray(object.material)
            ? object.material.map((material) => material.clone())
            : object.material.clone()
          object.userData.viewerBaseMaterial = object.material
          ensureDensityColors(object.geometry)
          attachTopologyOverlays(object)
        })

        const bounds = new THREE.Box3().setFromObject(preparedScene)
        const size = bounds.getSize(new THREE.Vector3())
        const center = bounds.getCenter(new THREE.Vector3())
        const maxDimension = Math.max(size.x, size.y, size.z, 0.001)
        const scale = 3 / maxDimension
        preparedScene.scale.setScalar(scale)
        const displayOffset = center.clone().multiplyScalar(-scale)
        preparedScene.position.copy(displayOffset)
        preparedScene.position.y -= 0.1

        setScene(preparedScene)
        onLoadingChange(false)
        onLoad?.({
          scene: preparedScene,
          source,
          format: resolvedFormat,
          analysis,
          displayTransform: {
            scale,
            position: preparedScene.position.toArray(),
          },
        })
      },
      undefined,
      (error) => {
        if (disposed) return
        onLoadingChange(false)
        onError?.(error)
      },
    )

    return () => {
      disposed = true
      preparedScene?.traverse((object) => {
        if (!object.isMesh) return
        disposeTopologyOverlays(object)
        object.userData.viewerOverlayMaterial?.dispose?.()
        object.geometry?.dispose()
        const baseMaterial = object.userData.viewerBaseMaterial || object.material
        const materials = Array.isArray(baseMaterial) ? baseMaterial : [baseMaterial]
        materials.forEach((material) => {
          if (!material) return
          Object.values(material).forEach((value) => {
            if (value?.isTexture) value.dispose()
          })
          material.dispose()
        })
      })
    }
  }, [format, source, onError, onLoad, onLoadingChange])

  useEffect(() => {
    scene?.traverse((object) => {
      if (!object.isMesh) return
      object.userData.viewerOverlayMaterial?.dispose?.()
      object.userData.viewerOverlayMaterial = null

      if (overlayState.density) {
        const colorAttribute = object.geometry.getAttribute('viewerDensityColor')
        if (colorAttribute) object.geometry.setAttribute('color', colorAttribute)
        object.userData.viewerOverlayMaterial = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.72,
          metalness: 0.02,
          side: THREE.DoubleSide,
        })
        object.material = object.userData.viewerOverlayMaterial
      } else if (overlayState.normals) {
        object.userData.viewerOverlayMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
        object.material = object.userData.viewerOverlayMaterial
      } else {
        object.material = object.userData.viewerBaseMaterial
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (material) {
          material.wireframe = overlayState.wireframe
          material.needsUpdate = true
        }
      })

      const topologyOverlays = object.userData.viewerTopologyOverlays
      if (topologyOverlays) {
        Object.entries(topologyOverlays).forEach(([overlayId, overlay]) => {
          overlay.visible = Boolean(overlayState[overlayId])
        })
      }
    })
  }, [overlayState, scene])

  return scene ? <primitive object={scene} /> : null
}

function Scene({ source, format, overlayState, showGrid, resetToken, cameraState, onCameraChange, focusTarget, onLoad, onError, onLoadingChange }) {
  return (
    <>
      <color attach="background" args={['#eef2f7']} />
      <fog attach="fog" args={['#eef2f7', 8, 15]} />
      <ambientLight intensity={1.4} />
      <hemisphereLight args={['#f8fbff', '#b7c4d3', 1.8]} />
      <directionalLight position={[4, 7, 5]} intensity={3.2} castShadow />
      <directionalLight position={[-5, 2, -3]} intensity={1.1} color="#8fbaff" />
      {source ? (
        <LoadedScene
          source={source}
          format={format}
          overlayState={overlayState}
          onLoad={onLoad}
          onError={onError}
          onLoadingChange={onLoadingChange}
        />
      ) : (
        <DemoGeometry wireframe={overlayState.wireframe} />
      )}
      {showGrid && <gridHelper args={[12, 12, '#b4c0ce', '#d6dde6']} position={[0, -2.05, 0]} />}
      <CameraController resetToken={resetToken} cameraState={cameraState} onCameraChange={onCameraChange} focusTarget={focusTarget} />
    </>
  )
}

function ModelViewer({
  source = null,
  format = null,
  modelName = '低模查看器自检对象',
  mode: controlledMode,
  onModeChange,
  onLoad,
  onError,
  showGrid: initialShowGrid = true,
  showOverlayControls = false,
  cameraState = null,
  onCameraChange,
  activeOverlay = null,
  focusTarget = null,
}) {
  const [internalMode, setInternalMode] = useState('solid')
  const [showGrid, setShowGrid] = useState(initialShowGrid)
  const [resetToken, setResetToken] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [overlayState, setOverlayState] = useState(createDefaultOverlayState)
  const [overlayPanelOpen, setOverlayPanelOpen] = useState(showOverlayControls)
  const [viewerAnalysis, setViewerAnalysis] = useState(null)
  const mode = controlledMode || internalMode

  const changeMode = (nextMode) => {
    setInternalMode(nextMode)
    onModeChange?.(nextMode)
    setOverlayState((current) => ({ ...current, wireframe: nextMode === 'wireframe' }))
  }

  const handleOverlayToggle = (item) => {
    if (item.id === 'wireframe') {
      const nextMode = overlayState.wireframe ? 'solid' : 'wireframe'
      setInternalMode(nextMode)
      onModeChange?.(nextMode)
    }
    setOverlayState((current) => {
      const nextValue = !current[item.id]
      const next = { ...current, [item.id]: nextValue }
      if (nextValue && item.exclusiveGroup === 'surface') {
        next.density = item.id === 'density'
        next.normals = item.id === 'normals'
      }
      return next
    })
  }

  const handleLoadedScene = useCallback((payload) => {
    setViewerAnalysis(payload.analysis)
    onLoad?.(payload)
  }, [onLoad])

  const handleError = useCallback((error) => {
    setErrorMessage('模型加载失败。请确认文件是有效的 GLB、GLTF、OBJ 或 FBX，并检查关联资源是否完整。')
    onError?.(error)
  }, [onError])

  const canvasLabel = useMemo(
    () => `${modelName} 3D 预览，可拖动旋转、滚轮缩放、右键平移`,
    [modelName],
  )

  useEffect(() => {
    setErrorMessage('')
    setViewerAnalysis(null)
    setOverlayState(createDefaultOverlayState())
    if (controlledMode === 'wireframe') {
      setOverlayState((current) => ({ ...current, wireframe: true }))
    }
  }, [controlledMode, source])

  useEffect(() => {
    if (activeOverlay) setOverlayPanelOpen(true)
    setOverlayState((current) => ({
      ...current,
      density: activeOverlay === 'density',
      normals: activeOverlay === 'normals',
      nonManifold: activeOverlay === 'nonManifold',
      boundaries: activeOverlay === 'boundaries',
      duplicateFaces: activeOverlay === 'duplicateFaces',
      degenerateFaces: activeOverlay === 'degenerateFaces',
      nearDegenerateFaces: activeOverlay === 'nearDegenerateFaces',
      sliverFaces: activeOverlay === 'sliverFaces',
    }))
  }, [activeOverlay])

  return (
    <section className="model-viewer" aria-label="3D 模型查看器">
      <div className="model-viewer__toolbar">
        <div className="model-viewer__modes" aria-label="模型显示模式">
          <button className={mode === 'solid' ? 'is-active' : ''} type="button" onClick={() => changeMode('solid')}>实体</button>
          <button className={mode === 'wireframe' ? 'is-active' : ''} type="button" onClick={() => changeMode('wireframe')}>线框</button>
        </div>
        <div className="model-viewer__actions">
          {showOverlayControls && (
            <button className={overlayPanelOpen ? 'is-active' : ''} type="button" onClick={() => setOverlayPanelOpen((value) => !value)}>Overlay</button>
          )}
          <button className={showGrid ? 'is-active' : ''} type="button" onClick={() => setShowGrid((value) => !value)}>网格</button>
          <button type="button" onClick={() => setResetToken((value) => value + 1)}>重置视角</button>
        </div>
      </div>

      <div className={`model-viewer__content${showOverlayControls && overlayPanelOpen ? ' is-overlay-open' : ''}`}>
        <div className="model-viewer__canvas" aria-label={canvasLabel}>
          <Canvas
            camera={{ position: CAMERA_POSITION, fov: 38, near: 0.1, far: 100 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: false }}
            shadows
          >
            <Scene
              source={source}
              format={format}
              overlayState={overlayState}
              showGrid={showGrid}
              resetToken={resetToken}
              cameraState={cameraState}
              onCameraChange={onCameraChange}
              focusTarget={focusTarget}
              onLoad={handleLoadedScene}
              onError={handleError}
              onLoadingChange={setIsLoading}
            />
          </Canvas>
          {isLoading && <div className="model-viewer__overlay" role="status"><span className="viewer-spinner" />正在读取模型…</div>}
          {errorMessage && (
            <div className="model-viewer__overlay is-error">
              <ErrorNotice
                compact
                title="无法显示模型"
                message={errorMessage}
                guidance="模型文件只用于当前会话，请重新选择有效文件。"
              />
            </div>
          )}
          {!source && <span className="model-viewer__demo-tag">程序生成 · 查看器自检对象</span>}
        </div>
        {showOverlayControls && overlayPanelOpen && (
          <OverlayPanel
            values={overlayState}
            analysis={viewerAnalysis}
            hasModel={Boolean(source && viewerAnalysis)}
            onToggle={handleOverlayToggle}
            onClose={() => setOverlayPanelOpen(false)}
          />
        )}
      </div>

      <div className="model-viewer__footer">
        <span className="model-viewer__name"><i />{modelName}</span>
        <span>左键旋转 · 滚轮缩放 · 右键平移</span>
      </div>
    </section>
  )
}

export default ModelViewer
