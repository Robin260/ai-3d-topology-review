import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ModelViewer from '../ModelViewer/ModelViewer.jsx'
import buildLiveGeometryComparison from '../../services/liveGeometryComparison.js'
import { streetLampTestGroup } from '../../config/sceneTestModels.js'
import './LiveComparisonWorkspace.css'

const ACCEPTED_FORMATS = ['glb', 'gltf', 'obj', 'fbx']
const emptySlot = { source: null, format: null, name: '', size: 0, analysis: null, displayTransform: null, error: '' }

const inferFormat = (name) => String(name || '').split('.').pop()?.toLowerCase() || ''
const formatFileSize = (bytes) => bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : '内置测试模型'
const formatValue = (value, precision) => Number.isFinite(value)
  ? value.toLocaleString('zh-CN', precision ? { maximumFractionDigits: precision } : undefined)
  : '未检测'
const formatDelta = (value, precision) => {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  return `${value > 0 ? '+' : ''}${value.toLocaleString('zh-CN', precision ? { maximumFractionDigits: precision } : undefined)}`
}

const cameraStatesEqual = (left, right) => {
  if (!left || !right) return false
  const leftValues = [...left.position, ...left.target, ...(left.up || []), left.zoom || 1]
  const rightValues = [...right.position, ...right.target, ...(right.up || []), right.zoom || 1]
  return leftValues.every((value, index) => Math.abs(value - rightValues[index]) < 0.0001)
}

const healthTone = {
  NOT_EVALUATED: 'neutral',
  BLOCKED: 'error',
  REVIEW_REQUIRED: 'warning',
  MEASURED_HEALTHY: 'success',
}

function UploadSlot({ side, slot, inputRef, onSelect }) {
  return (
    <div className={`live-pk-upload-slot${slot.source ? ' has-model' : ''}`}>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".glb,.gltf,.obj,.fbx,model/gltf-binary,model/gltf+json"
        onChange={(event) => onSelect(event.target.files?.[0] || null)}
      />
      <div><span>模型 {side}</span><strong>{slot.name || '尚未导入模型'}</strong><small>{slot.source ? `${slot.format.toUpperCase()} · ${formatFileSize(slot.size)}` : 'GLB / GLTF / OBJ / FBX'}</small></div>
      <button type="button" onClick={() => inputRef.current?.click()}>{slot.source ? '更换模型' : `导入模型 ${side}`}</button>
    </div>
  )
}

function ViewerSlot({ side, slot, viewerMode, onModeChange, cameraState, onCameraChange, activeOverlay, focusTarget, onLoad }) {
  if (!slot.source) {
    return (
      <div className="live-pk-viewer-empty">
        <span>{side}</span>
        <strong>等待导入模型 {side}</strong>
        <p>导入后这里会显示真实模型和本地几何检测结果。</p>
      </div>
    )
  }
  return (
    <div className="live-pk-viewer">
      <ModelViewer
        source={slot.source}
        format={slot.format}
        modelName={`模型 ${side} · ${slot.name}`}
        mode={viewerMode}
        onModeChange={onModeChange}
        cameraState={cameraState}
        onCameraChange={onCameraChange}
        activeOverlay={activeOverlay}
        focusTarget={focusTarget}
        onLoad={onLoad}
        showOverlayControls={false}
      />
    </div>
  )
}

function LiveComparisonWorkspace() {
  const inputARef = useRef(null)
  const inputBRef = useRef(null)
  const sourcesRef = useRef({ A: null, B: null })
  const [slotA, setSlotA] = useState(emptySlot)
  const [slotB, setSlotB] = useState(emptySlot)
  const [viewerMode, setViewerMode] = useState('solid')
  const [cameraState, setCameraState] = useState(null)
  const [activeOverlay, setActiveOverlay] = useState(null)
  const [focusTarget, setFocusTarget] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [streetLampCandidateId, setStreetLampCandidateId] = useState(streetLampTestGroup.candidates[0].id)

  const releaseSource = (source) => {
    if (String(source || '').startsWith('blob:')) URL.revokeObjectURL(source)
  }

  useEffect(() => {
    sourcesRef.current = { A: slotA.source, B: slotB.source }
  }, [slotA.source, slotB.source])

  useEffect(() => () => {
    releaseSource(sourcesRef.current.A)
    releaseSource(sourcesRef.current.B)
  }, [])

  const replaceSlot = useCallback((side, nextSlot) => {
    const setter = side === 'A' ? setSlotA : setSlotB
    setter((current) => {
      if (current.source !== nextSlot.source) releaseSource(current.source)
      return nextSlot
    })
    setSelectedRegion(null)
    setFocusTarget(null)
  }, [])

  const selectFile = useCallback((side, file) => {
    if (!file) return
    const format = inferFormat(file.name)
    if (!ACCEPTED_FORMATS.includes(format)) {
      replaceSlot(side, { ...emptySlot, name: file.name, error: '暂不支持这种文件格式。' })
      return
    }
    replaceSlot(side, {
      ...emptySlot,
      source: URL.createObjectURL(file),
      format,
      name: file.name,
      size: file.size,
    })
  }, [replaceSlot])

  const loadTestPair = useCallback(() => {
    replaceSlot('A', { ...emptySlot, source: '/models/topology-clean-cube.obj', format: 'obj', name: '健康封闭网格.obj' })
    replaceSlot('B', { ...emptySlot, source: '/models/auto-evaluation-diagnostic.obj', format: 'obj', name: '拓扑问题诊断网格.obj' })
  }, [replaceSlot])

  const loadStreetLampPair = useCallback(() => {
    const candidate = streetLampTestGroup.candidates.find((item) => item.id === streetLampCandidateId)
      || streetLampTestGroup.candidates[0]
    replaceSlot('A', {
      ...emptySlot,
      source: streetLampTestGroup.baseline.url,
      format: streetLampTestGroup.baseline.format,
      name: streetLampTestGroup.baseline.name,
    })
    replaceSlot('B', {
      ...emptySlot,
      source: candidate.url,
      format: candidate.format,
      name: candidate.name,
    })
  }, [replaceSlot, streetLampCandidateId])

  const handleLoaded = useCallback((side, payload) => {
    const setter = side === 'A' ? setSlotA : setSlotB
    setter((current) => ({ ...current, analysis: payload.analysis, displayTransform: payload.displayTransform, error: '' }))
  }, [])
  const handleLoadedA = useCallback((payload) => handleLoaded('A', payload), [handleLoaded])
  const handleLoadedB = useCallback((payload) => handleLoaded('B', payload), [handleLoaded])

  const handleCameraChange = useCallback((nextState) => {
    setCameraState((current) => cameraStatesEqual(current, nextState) ? current : nextState)
  }, [])

  const comparison = useMemo(
    () => buildLiveGeometryComparison(slotA.analysis, slotB.analysis),
    [slotA.analysis, slotB.analysis],
  )

  const locateRegion = (side, metric) => {
    const slot = side === 'A' ? slotA : slotB
    const region = slot.analysis?.issueRegions?.[metric.regionType]?.[0]
    if (!region?.center || !slot.displayTransform) return
    const point = region.center.map((value, index) => (
      value * slot.displayTransform.scale + slot.displayTransform.position[index]
    ))
    setActiveOverlay(metric.overlayId)
    setSelectedRegion({ side, metric, region })
    setFocusTarget({ point, token: Date.now() })
  }

  const ready = Boolean(slotA.analysis && slotB.analysis)

  return (
    <section className="live-pk-workspace">
      <div className="live-pk-heading">
        <div><span className="section-kicker">LIVE GEOMETRY PK</span><h2>直接导入两个模型，立即比较真实技术数据</h2><p>文件只在当前浏览器会话中读取，不上传服务器，也不会写入 localStorage。</p></div>
        <div className="live-pk-heading-actions">
          <button className="live-pk-test-button is-primary" type="button" onClick={loadStreetLampPair}>载入路灯真实测试组</button>
          <button className="live-pk-test-button" type="button" onClick={loadTestPair}>载入健康 / 问题测试对</button>
        </div>
      </div>

      <div className="live-pk-test-set">
        <div><span>REAL TEST SET 01</span><strong>{streetLampTestGroup.name}</strong><small>{streetLampTestGroup.productionTarget} · {streetLampTestGroup.assetType}</small></div>
        <div className="live-pk-test-set__baseline"><span>模型 A · 参考</span><strong>{streetLampTestGroup.baseline.shortName}</strong></div>
        <label><span>模型 B · AI 候选</span><select value={streetLampCandidateId} onChange={(event) => setStreetLampCandidateId(event.target.value)}>{streetLampTestGroup.candidates.map((item) => <option value={item.id} key={item.id}>{item.shortName}</option>)}</select></label>
        <button type="button" onClick={loadStreetLampPair}>开始真实对比</button>
      </div>

      <div className="live-pk-upload-grid">
        <UploadSlot side="A" slot={slotA} inputRef={inputARef} onSelect={(file) => selectFile('A', file)} />
        <div className="live-pk-versus">VS</div>
        <UploadSlot side="B" slot={slotB} inputRef={inputBRef} onSelect={(file) => selectFile('B', file)} />
      </div>

      <div className="live-pk-sync-bar">
        <div><strong>同步查看</strong><span>旋转、缩放、显示模式和问题图层同步</span></div>
        <div className="live-pk-sync-actions">
          <button className={viewerMode === 'solid' ? 'is-active' : ''} type="button" onClick={() => setViewerMode('solid')}>实体</button>
          <button className={viewerMode === 'wireframe' ? 'is-active' : ''} type="button" onClick={() => setViewerMode('wireframe')}>线框</button>
          {[
            ['nonManifold', '非流形'],
            ['boundaries', '开放边'],
            ['duplicateFaces', '重复面'],
            ['degenerateFaces', '零面积'],
            ['nearDegenerateFaces', '近退化'],
            ['sliverFaces', '狭长面'],
          ].map(([id, label]) => <button className={activeOverlay === id ? 'is-active' : ''} type="button" key={id} onClick={() => setActiveOverlay((current) => current === id ? null : id)}>{label}</button>)}
        </div>
      </div>

      <div className="live-pk-viewer-grid">
        <ViewerSlot side="A" slot={slotA} viewerMode={viewerMode} onModeChange={setViewerMode} cameraState={cameraState} onCameraChange={handleCameraChange} activeOverlay={activeOverlay} focusTarget={focusTarget} onLoad={handleLoadedA} />
        <ViewerSlot side="B" slot={slotB} viewerMode={viewerMode} onModeChange={setViewerMode} cameraState={cameraState} onCameraChange={handleCameraChange} activeOverlay={activeOverlay} focusTarget={focusTarget} onLoad={handleLoadedB} />
      </div>

      <div className="live-pk-result-heading">
        <div><span>数据来源</span><strong>{comparison.dataSource}</strong></div>
        <div className={`is-${healthTone[comparison.healthA.status]}`}><span>模型 A</span><strong>{comparison.healthA.label}</strong></div>
        <div className={`is-${healthTone[comparison.healthB.status]}`}><span>模型 B</span><strong>{comparison.healthB.label}</strong></div>
        <div><span>技术项建议</span><strong>{ready ? comparison.recommendation === 'HOLD' ? '暂不判胜负' : `模型 ${comparison.recommendation} 更稳妥` : '等待两个模型'}</strong></div>
      </div>

      {ready && (
        <div className={`live-pk-fairness is-${comparison.fairness.status.toLowerCase()}`}>
          <span>对比公平性</span>
          <strong>{comparison.fairness.label}</strong>
          <p>{comparison.fairness.reason}</p>
        </div>
      )}

      <div className="live-pk-metric-table" role="table" aria-label="两个模型的真实几何数据差异">
        <div className="live-pk-metric-row is-heading" role="row"><span>检测指标</span><span>模型 A</span><span>模型 B</span><span>B − A</span><span>证据定位</span></div>
        {comparison.metrics.map((metric) => (
          <div className={`live-pk-metric-row is-${metric.severity || 'info'}`} role="row" key={metric.id}>
            <span><strong>{metric.label}</strong><small>{metric.direction === 'lower' ? '数值越低风险通常越小' : '用于规模对照，不直接判优劣'}</small></span>
            <span className={metric.advantage === 'A' ? 'is-advantage' : ''}>{formatValue(metric.valueA, metric.precision)}</span>
            <span className={metric.advantage === 'B' ? 'is-advantage' : ''}>{formatValue(metric.valueB, metric.precision)}</span>
            <span>{formatDelta(metric.delta, metric.precision)}</span>
            <span className="live-pk-locate-actions">
              {metric.regionCountA > 0 && <button type="button" onClick={() => locateRegion('A', metric)}>定位 A · {metric.regionCountA}</button>}
              {metric.regionCountB > 0 && <button type="button" onClick={() => locateRegion('B', metric)}>定位 B · {metric.regionCountB}</button>}
              {!metric.regionCountA && !metric.regionCountB && <em>—</em>}
            </span>
          </div>
        ))}
      </div>

      {selectedRegion && (
        <div className="live-pk-region-detail" role="status">
          <span>已定位模型 {selectedRegion.side}</span>
          <strong>{selectedRegion.metric.label} · {selectedRegion.region.objectName}</strong>
          <p>{Number.isInteger(selectedRegion.region.triangleIndex) ? `三角面 #${selectedRegion.region.triangleIndex}` : selectedRegion.region.edgeKey ? `边 ${selectedRegion.region.vertexIndices.join('–')}` : '顶点区域'}；查看器已同步聚焦并开启对应问题图层。</p>
        </div>
      )}

      <div className="live-pk-conclusion">
        <strong>{ready ? comparison.reason : '请先导入模型 A 和模型 B。'}</strong>
        <p>{comparison.limitations}</p>
      </div>
    </section>
  )
}

export default LiveComparisonWorkspace
