import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ModelViewer from '../components/ModelViewer/ModelViewer.jsx'
import ScoreForm from '../components/ScoreForm/ScoreForm.jsx'
import GeometryInspection from '../components/GeometryInspection/GeometryInspection.jsx'
import ProductionContextSelector from '../components/ProductionContext/ProductionContextSelector.jsx'
import AutoEvaluationReport from '../components/AutoEvaluation/AutoEvaluationReport.jsx'
import ModelTestPanel from '../components/ModelTestCases/ModelTestPanel.jsx'
import UniversalCompletionPanel from '../components/EvaluationWorkflow/UniversalCompletionPanel.jsx'
import SpecializedEvaluationPanel from '../components/EvaluationWorkflow/SpecializedEvaluationPanel.jsx'
import EvaluationStepRail from '../components/EvaluationWorkspace/EvaluationStepRail.jsx'
import RoleInsightPanel from '../components/EvaluationWorkspace/RoleInsightPanel.jsx'
import SpecializedTestSetPanel from '../components/EvaluationWorkspace/SpecializedTestSetPanel.jsx'
import SpecializedDataStatus from '../components/EvaluationWorkspace/SpecializedDataStatus.jsx'
import { Button, StatusCard } from '../components/ui/index.js'
import {
  universalExampleResult,
  universalGateLabels,
  universalRubric,
  universalRules,
} from '../config/rule.js'
import {
  getAssetType,
  getModelSource,
  getPipelineStage,
  getPlatformProfile,
  getProductionTarget,
  normalizeProductionContext,
} from '../config/productionContext.js'
import { streetLampTestGroup } from '../config/sceneTestModels.js'
import { storageService } from '../services/storageService.js'
import { generateAutomaticEvaluation } from '../services/automaticEvaluationEngine.js'
import {
  buildUniversalEvaluationDraft,
} from '../services/universalEvaluationWorkflow.js'
import { buildSpecializedEvaluationDraft } from '../services/specializedEvaluationWorkflow.js'
import { deliveryStatusCopy, evaluateDeliveryGates } from '../services/deliveryGateEngine.js'
import './pages.css'

const confidenceLabels = {
  HIGH: '高',
  MEDIUM_HIGH: '中高',
  MEDIUM: '中',
  LOW: '低',
}

const gateTones = {
  PASS: 'success',
  CONDITIONAL_PASS: 'warning',
  FAIL: 'error',
  NOT_EVALUATED: 'neutral',
}

function EvaluatePage() {
  const navigate = useNavigate()
  const { evaluationStage } = useParams()
  const [searchParams] = useSearchParams()
  const pageStage = evaluationStage === 'specialized' ? 'specialized' : 'universal'
  const resumeRecordId = searchParams.get('resume')
  const fileInputRef = useRef(null)
  const referenceInputRef = useRef(null)
  const [modelSource, setModelSource] = useState(null)
  const [modelFormat, setModelFormat] = useState(null)
  const [modelName, setModelName] = useState('低模查看器自检对象')
  const [viewerState, setViewerState] = useState('演示几何')
  const [referenceName, setReferenceName] = useState('')
  const [geometryAnalysis, setGeometryAnalysis] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)
  const [selectedTestCaseId, setSelectedTestCaseId] = useState(null)
  const [modelReference, setModelReference] = useState({ sourceType: 'DEMO', sourceId: null, url: null })
  const [saveStatus, setSaveStatus] = useState('idle')
  const [resumeRecord, setResumeRecord] = useState(null)
  const [resumeStatus, setResumeStatus] = useState(null)
  const [activeEvaluationStage, setActiveEvaluationStage] = useState('idle')
  const [manualRuleResults, setManualRuleResults] = useState({})
  const [finalUniversalResult, setFinalUniversalResult] = useState(null)
  const [formalSaveStatus, setFormalSaveStatus] = useState('idle')
  const [specializedManualResults, setSpecializedManualResults] = useState({})
  const [finalSpecializedResult, setFinalSpecializedResult] = useState(null)
  const [gateResult, setGateResult] = useState(null)
  const [reportSaveStatus, setReportSaveStatus] = useState('idle')
  const [productionContext, setProductionContext] = useState(() => (
    normalizeProductionContext(storageService.getSettings().productionContext)
  ))
  const [evaluationMode, setEvaluationMode] = useState('LOW_POLY_ONLY')
  const [selectedDimensionId, setSelectedDimensionId] = useState(universalRubric.dimensions[0].id)
  const handleModelLoad = useCallback((payload) => {
    setGeometryAnalysis(payload.analysis)
    setViewerState('基础预检完成')
  }, [])
  const handleModelError = useCallback(() => {
    setGeometryAnalysis(null)
    setActiveEvaluationStage('idle')
    setViewerState('加载失败')
  }, [])

  useEffect(() => () => {
    if (modelSource?.startsWith('blob:')) URL.revokeObjectURL(modelSource)
  }, [modelSource])

  useEffect(() => {
    storageService.saveSettings({ productionContext })
  }, [productionContext])

  useEffect(() => {
    if (evaluationStage !== 'universal' && evaluationStage !== 'specialized') {
      navigate('/evaluate/universal', { replace: true })
    }
  }, [evaluationStage, navigate])

  useEffect(() => {
    if (!resumeRecordId) return
    const record = storageService.getRecord(resumeRecordId)
    if (!record) {
      setResumeRecord(null)
      setResumeStatus('missing')
      return
    }

    const reference = record.modelReference || { sourceType: record.modelA?.sourceType || 'LOCAL_UPLOAD', sourceId: null, url: null }
    setResumeRecord(record)
    setModelReference(reference)
    setProductionContext(normalizeProductionContext(record.productionContext))
    setEvaluationMode(record.universalResult?.model?.evaluationMode || 'LOW_POLY_ONLY')
    setModelName(record.modelA?.name || record.universalResult?.model?.name || '待完善模型')
    setModelFormat(record.modelA?.format || record.universalResult?.model?.fileFormat?.toLowerCase() || null)
    setGeometryAnalysis(null)
    setActiveEvaluationStage('idle')
    setManualRuleResults(Object.fromEntries(
      (record.universalResult?.manualRuleResults || [])
        .filter((result) => result?.ruleId)
        .map((result) => [result.ruleId, result]),
    ))
    setFinalUniversalResult(record.universalResult?.overallScore !== null && record.universalResult?.overallScore !== undefined
      ? record.universalResult
      : null)
    setFormalSaveStatus(record.universalResult?.overallScore !== null && record.universalResult?.overallScore !== undefined ? 'success' : 'idle')
    setSpecializedManualResults(Object.fromEntries(
      (record.specializedResult?.manualRuleResults || [])
        .filter((result) => result?.ruleId)
        .map((result) => [result.ruleId, result]),
    ))
    setFinalSpecializedResult(record.specializedResult || null)
    setGateResult(record.gateResult || null)
    setReportSaveStatus(record.evaluationState === 'complete' ? 'success' : 'idle')

    if (reference.sourceType === 'BUILT_IN' && reference.url) {
      setModelSource(reference.url)
      setSelectedTestCaseId(reference.sourceId || null)
      setFileInfo({ name: reference.url.split('/').at(-1), size: null, format: record.modelA?.format || 'obj', sourceType: 'BUILT_IN' })
      setViewerState('读取中')
      setResumeStatus('restoring')
    } else {
      setModelSource(null)
      setSelectedTestCaseId(null)
      setFileInfo(null)
      setViewerState('等待重新选择模型')
      setResumeStatus('needs_file')
    }
  }, [resumeRecordId])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (modelSource?.startsWith('blob:')) URL.revokeObjectURL(modelSource)
    setModelSource(URL.createObjectURL(file))
    setModelFormat(file.name.split('.').pop()?.toLowerCase() || null)
    setModelName(file.name)
    setFileInfo({ name: file.name, size: file.size, format: file.name.split('.').pop()?.toLowerCase() || '' })
    setSelectedTestCaseId(null)
    setModelReference({ sourceType: 'LOCAL_UPLOAD', sourceId: file.name, url: null })
    if (resumeStatus !== 'needs_file') setResumeRecord(null)
    setResumeStatus(resumeStatus === 'needs_file' ? 'restoring' : null)
    setGeometryAnalysis(null)
    setViewerState('读取中')
    setActiveEvaluationStage('idle')
    setManualRuleResults({})
    setFinalUniversalResult(null)
    setFormalSaveStatus('idle')
    setSpecializedManualResults({})
    setFinalSpecializedResult(null)
    setGateResult(null)
    setReportSaveStatus('idle')
    event.target.value = ''
  }

  const handleReferenceChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setReferenceName(file.name)
    event.target.value = ''
  }

  const handleTestCaseSelect = (testCase) => {
    if (modelSource?.startsWith('blob:')) URL.revokeObjectURL(modelSource)
    setModelSource(testCase.url)
    setModelFormat(testCase.format)
    setModelName(testCase.name)
    setFileInfo({ name: testCase.url.split('/').at(-1), size: null, format: testCase.format, sourceType: 'BUILT_IN' })
    setSelectedTestCaseId(testCase.id)
    setModelReference({ sourceType: 'BUILT_IN', sourceId: testCase.id, url: testCase.url })
    const continuesRestoredRecord = resumeRecord?.modelReference?.sourceId === testCase.id
    if (!continuesRestoredRecord) setResumeRecord(null)
    setResumeStatus(continuesRestoredRecord ? 'restoring' : null)
    setGeometryAnalysis(null)
    setViewerState('读取中')
    setActiveEvaluationStage('idle')
    setManualRuleResults({})
    setFinalUniversalResult(null)
    setFormalSaveStatus('idle')
    setSpecializedManualResults({})
    setFinalSpecializedResult(null)
    setGateResult(null)
    setReportSaveStatus('idle')
  }

  const handleSpecializedTestModelSelect = (testModel) => {
    handleTestCaseSelect(testModel)
    setProductionContext(normalizeProductionContext({
      ...streetLampTestGroup.specializedPreset,
      modelSourceId: testModel.sourceTypeId,
    }))
  }

  const automaticResult = useMemo(() => generateAutomaticEvaluation({
    analysis: geometryAnalysis,
    modelName,
    modelFormat,
    evaluationMode,
  }), [evaluationMode, geometryAnalysis, modelFormat, modelName])
  const universalDraft = useMemo(() => (
    automaticResult
      ? buildUniversalEvaluationDraft({
        automaticResult,
        manualResults: manualRuleResults,
        mode: evaluationMode,
        modelName,
        modelFormat,
      })
      : null
  ), [automaticResult, evaluationMode, manualRuleResults, modelFormat, modelName])
  const specializedDraft = useMemo(() => buildSpecializedEvaluationDraft({
    context: productionContext,
    universalResult: finalUniversalResult,
    manualResults: specializedManualResults,
    geometryAnalysis,
  }), [finalUniversalResult, geometryAnalysis, productionContext, specializedManualResults])
  useEffect(() => {
    setSaveStatus('idle')
  }, [automaticResult?.evaluationId])

  useEffect(() => {
    if (automaticResult && resumeStatus === 'restoring') setResumeStatus('restored')
  }, [automaticResult, resumeStatus])
  const showDemoResult = !modelSource && evaluationMode === universalExampleResult.model.evaluationMode
  const result = finalUniversalResult || automaticResult || (showDemoResult ? universalExampleResult : null)
  const isFormalUniversalResult = Boolean(finalUniversalResult?.overallScore !== null && finalUniversalResult?.overallScore !== undefined)
  const isAutomaticResult = Boolean(automaticResult) && !isFormalUniversalResult
  const displayScore = result?.overallScore ?? result?.partialScore ?? null
  const resultByRule = useMemo(
    () => universalDraft?.values || Object.fromEntries((result?.ruleResults || []).map((item) => [item.ruleId, item])),
    [result, universalDraft],
  )
  const gradeName = universalRubric.gradeRules.find((grade) => grade.grade === result?.grade)?.description
  const productionContextComplete = Boolean(
    productionContext.productionTargetId && productionContext.assetTypeId && productionContext.platformProfileId,
  )
  const productionContextLabels = {
    target: getProductionTarget(productionContext.productionTargetId)?.name || '',
    assetType: getAssetType(productionContext.assetTypeId)?.name || '',
    platform: getPlatformProfile(productionContext.platformProfileId)?.name || '',
    complete: productionContextComplete,
  }
  const stageQuery = searchParams.toString() ? `?${searchParams.toString()}` : ''

  const handleStartUniversalTask = () => {
    setActiveEvaluationStage('universal')
    if (pageStage !== 'universal') navigate(`/evaluate/universal${stageQuery}`)
    window.setTimeout(() => document.getElementById('model-evaluation-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const handleStartSpecializedTask = () => {
    setActiveEvaluationStage('specialized')
    if (pageStage !== 'specialized') navigate(`/evaluate/specialized${stageQuery}`)
    window.setTimeout(() => document.getElementById('specialized-evaluation-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const handleEvaluationModeChange = (nextMode) => {
    setEvaluationMode(nextMode)
    setFinalUniversalResult(null)
    setFormalSaveStatus('idle')
    setSpecializedManualResults({})
    setFinalSpecializedResult(null)
    setGateResult(null)
    setReportSaveStatus('idle')
  }

  const handleManualRuleChange = (nextValues) => {
    setManualRuleResults(Object.fromEntries(
      Object.entries(nextValues).filter(([, value]) => value?.evaluatedBy === 'MANUAL_REVIEWER'),
    ))
    setFinalUniversalResult(null)
    setFormalSaveStatus('idle')
    setSpecializedManualResults({})
    setFinalSpecializedResult(null)
    setGateResult(null)
    setReportSaveStatus('idle')
  }

  const handleFinalizeUniversalResult = () => {
    if (!universalDraft?.readiness.isComplete) return
    setFinalUniversalResult({
      ...universalDraft.result,
      evaluationState: 'COMPLETE_HYBRID',
      generatedAt: new Date().toISOString(),
    })
    setFormalSaveStatus('idle')
    setSpecializedManualResults({})
    setFinalSpecializedResult(null)
    setGateResult(null)
    setReportSaveStatus('idle')
  }

  const handleProductionContextChange = (nextContext) => {
    const currentProfile = `${productionContext.productionTargetId || ''}|${productionContext.assetTypeId || ''}|${productionContext.platformProfileId || ''}`
    const nextProfile = `${nextContext.productionTargetId || ''}|${nextContext.assetTypeId || ''}|${nextContext.platformProfileId || ''}`
    setProductionContext(nextContext)
    if (currentProfile !== nextProfile) {
      setSpecializedManualResults({})
      setFinalSpecializedResult(null)
      setGateResult(null)
      setReportSaveStatus('idle')
    }
  }

  const handleSpecializedRuleChange = (nextValues) => {
    setSpecializedManualResults(nextValues)
    setFinalSpecializedResult(null)
    setGateResult(null)
    setReportSaveStatus('idle')
  }

  const handleFinalizeSpecializedResult = () => {
    if (!specializedDraft?.readiness?.isComplete || !specializedDraft.result) return
    const specializedResult = {
      ...specializedDraft.result,
      generatedAt: new Date().toISOString(),
    }
    setFinalSpecializedResult(specializedResult)
    setGateResult(evaluateDeliveryGates({ universalResult: finalUniversalResult, specializedResult }))
    setReportSaveStatus('idle')
  }

  const handleSaveAutomaticResult = () => {
    if (!automaticResult) return
    const target = getProductionTarget(productionContext.productionTargetId)
    const assetType = getAssetType(productionContext.assetTypeId)
    const platform = getPlatformProfile(productionContext.platformProfileId)
    const pipelineStage = getPipelineStage(productionContext.pipelineStageId)
    const declaredSource = getModelSource(productionContext.modelSourceId)
    const saved = storageService.saveRecord({
      id: resumeRecord?.id,
      type: 'single',
      modelA: {
        modelId: modelReference.sourceId || automaticResult.model.modelId,
        name: modelName,
        version: `auto-${new Date(automaticResult.generatedAt).toLocaleString('zh-CN')}`,
        sourceType: modelReference.sourceType,
        sourceLabel: declaredSource?.name || (modelReference.sourceType === 'BUILT_IN' ? '内置测试模型' : '本地上传'),
        format: modelFormat,
      },
      scoresA: automaticResult.dimensionScores,
      totalScoreA: null,
      gradeA: null,
      comment: '阶段 5 本地部分自动评测，等待人工或 AI 视觉规则补全。',
      rubricVersion: automaticResult.rubricId,
      universalResult: automaticResult,
      specializedResult: null,
      gateResult: null,
      deliveryStatus: null,
      evaluationState: 'partial_automatic',
      productionContext: {
        ...productionContext,
        targetName: target?.name || null,
        assetTypeName: assetType?.name || null,
        platformName: platform?.name || null,
        pipelineStageName: pipelineStage?.name || null,
      },
      modelReference,
    })
    setSaveStatus(saved.ok ? 'success' : 'error')
    if (saved.ok) setResumeRecord(saved.record)
  }

  const handleSaveFormalUniversalResult = () => {
    if (!finalUniversalResult?.overallScore && finalUniversalResult?.overallScore !== 0) return
    const target = getProductionTarget(productionContext.productionTargetId)
    const assetType = getAssetType(productionContext.assetTypeId)
    const platform = getPlatformProfile(productionContext.platformProfileId)
    const pipelineStage = getPipelineStage(productionContext.pipelineStageId)
    const declaredSource = getModelSource(productionContext.modelSourceId)
    const saved = storageService.saveRecord({
      id: resumeRecord?.id,
      type: 'single',
      modelA: {
        modelId: modelReference.sourceId || finalUniversalResult.model.modelId,
        name: modelName,
        version: `review-${new Date(finalUniversalResult.generatedAt).toLocaleString('zh-CN')}`,
        sourceType: modelReference.sourceType,
        sourceLabel: declaredSource?.name || (modelReference.sourceType === 'BUILT_IN' ? '内置测试模型' : '本地上传'),
        format: modelFormat,
      },
      scoresA: finalUniversalResult.dimensionScores,
      totalScoreA: Number(finalUniversalResult.overallScore.toFixed(1)),
      gradeA: finalUniversalResult.grade,
      comment: '通用正式评测已完成；质量分由真实自动检测与人工确认共同生成，门槛和专项结论仍独立处理。',
      rubricVersion: finalUniversalResult.rubricId,
      universalResult: finalUniversalResult,
      specializedResult: null,
      gateResult: null,
      deliveryStatus: null,
      evaluationState: 'universal_complete',
      productionContext: {
        ...productionContext,
        targetName: target?.name || null,
        assetTypeName: assetType?.name || null,
        platformName: platform?.name || null,
        pipelineStageName: pipelineStage?.name || null,
      },
      modelReference,
    })
    setFormalSaveStatus(saved.ok ? 'success' : 'error')
    if (saved.ok) setResumeRecord(saved.record)
  }

  const handleSaveCompleteReport = () => {
    if (!finalSpecializedResult || !gateResult) return
    const hasUniversalBaseline = Boolean(finalUniversalResult)
    const target = getProductionTarget(productionContext.productionTargetId)
    const assetType = getAssetType(productionContext.assetTypeId)
    const platform = getPlatformProfile(productionContext.platformProfileId)
    const pipelineStage = getPipelineStage(productionContext.pipelineStageId)
    const declaredSource = getModelSource(productionContext.modelSourceId)
    const saved = storageService.saveRecord({
      id: resumeRecord?.id,
      type: 'single',
      modelA: {
        modelId: modelReference.sourceId || finalUniversalResult?.model?.modelId || `SPECIALIZED_${Date.now()}`,
        name: modelName,
        version: `${hasUniversalBaseline ? 'complete' : 'specialized'}-${new Date(finalSpecializedResult.generatedAt).toLocaleString('zh-CN')}`,
        sourceType: modelReference.sourceType,
        sourceLabel: declaredSource?.name || (modelReference.sourceType === 'BUILT_IN' ? '内置测试模型' : '本地上传'),
        format: modelFormat,
      },
      scoresA: finalUniversalResult?.dimensionScores || {},
      totalScoreA: hasUniversalBaseline ? Number(finalUniversalResult.overallScore.toFixed(1)) : null,
      gradeA: finalUniversalResult?.grade || null,
      comment: hasUniversalBaseline
        ? `完整评测已完成：通用质量 ${finalUniversalResult.overallScore.toFixed(1)} 分，专项质量 ${finalSpecializedResult.overallScore.toFixed(1)} 分，交付状态为${deliveryStatusCopy[gateResult.deliveryStatus].name}。`
        : `独立专项评测已完成：专项质量 ${finalSpecializedResult.overallScore.toFixed(1)} 分，${deliveryStatusCopy[gateResult.deliveryStatus].name}；通用基础未评测。`,
      rubricVersion: hasUniversalBaseline ? `${finalUniversalResult.rubricId}__${finalSpecializedResult.rubricVersion}` : finalSpecializedResult.rubricVersion,
      universalResult: finalUniversalResult,
      specializedResult: finalSpecializedResult,
      gateResult,
      deliveryStatus: gateResult.deliveryStatus,
      evaluationState: hasUniversalBaseline ? 'complete' : 'specialized_complete',
      productionContext: {
        ...productionContext,
        targetName: target?.name || null,
        assetTypeName: assetType?.name || null,
        platformName: platform?.name || null,
        pipelineStageName: pipelineStage?.name || null,
      },
      modelReference,
    })
    setReportSaveStatus(saved.ok ? 'success' : 'error')
    if (saved.ok) setResumeRecord(saved.record)
  }

  return (
    <div className="page-stack universal-evaluation-page">
      <div className="page-heading-row universal-page-heading">
        <div>
          <span className="section-kicker">{pageStage === 'specialized' ? 'SPECIALIZED PRODUCTION' : 'UNIVERSAL TOPOLOGY REVIEW'}</span>
          <h1>{pageStage === 'specialized' ? '专项生产评测' : '通用标准评测'}</h1>
          <p>{pageStage === 'specialized' ? '生产目标、资产类型、平台与交付门槛。' : '导入模型，完成基础检测与统一质量评分。'}</p>
        </div>
        <div className="evaluation-page-tabs" aria-label="评测页面切换">
          <Link className={pageStage === 'universal' ? 'is-active' : ''} to={`/evaluate/universal${stageQuery}`}>通用评测</Link>
          <Link className={pageStage === 'specialized' ? 'is-active' : ''} to={`/evaluate/specialized${stageQuery}`}>专项评测</Link>
        </div>
      </div>
      <input ref={fileInputRef} className="visually-hidden" type="file" accept=".glb,.gltf,.obj,.fbx,model/gltf-binary,model/gltf+json" onChange={handleFileChange} />

      {pageStage === 'universal' && <div className="evaluation-mode-bar">
        <div>
          <strong>通用评测模式</strong>
          <span>只决定基础规则范围</span>
        </div>
        <div className="mode-actions">
          <div className="mode-segmented" role="group" aria-label="通用评测模式">
            {universalRubric.evaluationModes.map((mode) => (
              <button
                className={evaluationMode === mode.id ? 'is-active' : ''}
                key={mode.id}
                type="button"
                title={mode.description}
                onClick={() => handleEvaluationModeChange(mode.id)}
              >{mode.name}</button>
            ))}
          </div>
          {evaluationMode === 'REFERENCE_COMPARISON' && (
            <div>
              <input ref={referenceInputRef} className="visually-hidden" type="file" accept=".glb,.gltf,.obj,.fbx,model/gltf-binary,model/gltf+json" onChange={handleReferenceChange} />
              <button className="reference-file-button" type="button" onClick={() => referenceInputRef.current?.click()}>{referenceName || '选择参考高模'}</button>
            </div>
          )}
        </div>
      </div>}

      {resumeStatus && (
        <section className={`resume-evaluation-banner is-${resumeStatus}`}>
          <StatusCard
            tone={resumeStatus === 'missing' ? 'error' : resumeStatus === 'needs_file' ? 'warning' : 'info'}
            label="待完善评测恢复"
            title={resumeStatus === 'missing' ? '没有找到这条评测记录' : resumeStatus === 'needs_file' ? '结构化结果已找到，请重新选择原模型文件' : resumeStatus === 'restoring' ? '正在恢复模型和自动检测' : '模型与评测上下文已经恢复'}
            description={resumeStatus === 'needs_file' ? `记录中的模型为“${resumeRecord?.modelA?.name || '本地模型'}”。出于隐私和容量限制，浏览器没有保存文件本体。` : resumeStatus === 'missing' ? '记录可能已被清理或来自其他浏览器。您仍然可以开始一次新的评测。' : '继续保存时会更新原记录，不会额外生成重复记录。'}
            meta={resumeRecord?.id ? `记录 ${resumeRecord.id.slice(0, 8)}` : '恢复失败'}
          />
          {resumeStatus === 'needs_file' && <Button onClick={() => fileInputRef.current?.click()}>重新选择模型文件</Button>}
        </section>
      )}

      {pageStage === 'universal' && <>
      <details className="compact-utility-details">
        <summary>使用内置测试模型</summary>
        <ModelTestPanel selectedId={selectedTestCaseId} onSelect={handleTestCaseSelect} />
      </details>

      <div className="universal-workspace-grid evaluation-primary-workspace" id="model-evaluation-workspace">
        <EvaluationStepRail
          stage="universal"
          modelName={modelName}
          hasModel={Boolean(modelSource)}
          automaticResult={automaticResult}
          finalUniversalResult={finalUniversalResult}
          activeStage={activeEvaluationStage}
          onImport={() => fileInputRef.current?.click()}
          onStartUniversal={handleStartUniversalTask}
        />
        <ModelViewer
          source={modelSource}
          format={modelFormat}
          modelName={modelName}
          onLoad={handleModelLoad}
          onError={handleModelError}
          showOverlayControls
        />

        <aside className="universal-summary-panel">
          <div className="summary-heading-row">
            <div><span>{isFormalUniversalResult ? '正式通用质量分' : isAutomaticResult ? '已测规则表现' : '综合质量分'}</span><strong>{displayScore === null ? '—' : displayScore.toFixed(1)}</strong><small>/ 100</small></div>
            <div className={`grade-badge${result ? '' : ' is-unassessed'}`}>
              <strong>{result?.grade || (isAutomaticResult ? '部分结果' : '未评测')}</strong>
              <span>{isFormalUniversalResult ? result.gradeName : isAutomaticResult ? '不生成正式等级' : (result ? '基本可用' : '等待检测')}</span>
            </div>
          </div>

          <StatusCard
            compact
            tone={gateTones[result?.productionReadyBase || 'NOT_EVALUATED']}
            label="通用基础状态"
            title={isFormalUniversalResult ? '正式质量评测已完成' : isAutomaticResult ? '部分自动评测完成' : universalGateLabels[result?.productionReadyBase || 'NOT_EVALUATED']}
            meta={isFormalUniversalResult ? '门槛与交付状态将在下一步计算' : isAutomaticResult ? '覆盖不足，不生成交付状态' : '这不是最终交付结论'}
          />

          <div className="summary-metrics">
            <div><span>覆盖率</span><strong>{result ? `${Math.round(result.evaluatedCoverage * 100)}%` : '—'}</strong></div>
            <div><span>置信度</span><strong>{result ? confidenceLabels[result.confidence] : '—'}</strong></div>
            <div><span>问题</span><strong>{result?.issues.length ?? '—'}</strong></div>
            <div><span>模型状态</span><strong>{viewerState}</strong></div>
          </div>

          <div className="dimension-overview">
            <div className="dimension-overview__heading"><strong>七维质量总览</strong><span>{isFormalUniversalResult ? '正式混合结果' : isAutomaticResult ? '真实部分结果' : (showDemoResult ? '演示数据' : '尚无结果')}</span></div>
            {universalRubric.dimensions.map((dimension, index) => {
              const dimensionResult = result?.dimensionScores[dimension.id]
              const score = dimensionResult ? Math.min(dimensionResult.score, dimension.weight) : null
              const progress = score === null ? 0 : score / dimension.weight * 100
              return (
                <button
                  className={`dimension-row${selectedDimensionId === dimension.id ? ' is-active' : ''}`}
                  key={dimension.id}
                  type="button"
                  onClick={() => setSelectedDimensionId(dimension.id)}
                >
                  <span className="dimension-index">{index + 1}</span>
                  <span className="dimension-name">{dimension.name}</span>
                  <span className="dimension-bar"><i style={{ width: `${progress}%` }} /></span>
                  <strong>{score === null ? '—' : score.toFixed(1)} <small>/ {dimension.weight}</small></strong>
                </button>
              )
            })}
          </div>
          {result && <p className="summary-caption">{isFormalUniversalResult ? finalUniversalResult.summary.overallAssessment : isAutomaticResult ? '仅代表已经自动检测的规则表现；未检测维度不按零分计算。' : gradeName}</p>}
        </aside>
      </div>

      <div className="evaluation-lower-workspace">
        <section className="issue-snapshot-panel">
          <div className="compact-panel-heading"><strong>问题证据</strong><span>{result?.issues?.length || 0} 项</span></div>
          <div className="issue-snapshot-grid">
            {(result?.issues || []).slice(0, 2).map((issue, index) => (
              <article key={issue.issueId || `${issue.ruleId}-${index}`}>
                <span>P{index + 1}</span>
                <div><strong>{universalRules.find((rule) => rule.id === issue.ruleId)?.name || issue.title || issue.ruleId}</strong><p>{issue.evidence || issue.consequence || '等待补充证据'}</p></div>
                <em>{issue.severity || 'REVIEW'}</em>
              </article>
            ))}
            {!result?.issues?.length && <div className="issue-snapshot-empty">导入模型后显示可追溯的问题证据。</div>}
          </div>
        </section>
        <RoleInsightPanel stage="universal" modelName={modelName} modelFormat={modelFormat} result={result} productionContext={productionContext} />
      </div>

      <details className="compact-utility-details">
        <summary>查看几何技术数据</summary>
        <GeometryInspection
          analysis={geometryAnalysis}
          fileInfo={fileInfo}
          loading={viewerState === '读取中'}
          hasError={viewerState === '加载失败'}
        />
      </details>

      {automaticResult && <details className="compact-utility-details">
        <summary>查看全部自动检测证据</summary>
        <AutoEvaluationReport result={automaticResult} onSave={handleSaveAutomaticResult} saveStatus={saveStatus} formalComplete={isFormalUniversalResult} />
      </details>}

      <details id="universal-review-workspace" className={`universal-review-workspace${activeEvaluationStage === 'universal' ? ' is-active' : ''}${finalUniversalResult ? ' is-complete' : ''}`} open={activeEvaluationStage === 'universal' && !finalUniversalResult}>
        <summary className="universal-review-heading">
          <div><span className="section-kicker">RULE REVIEW</span><h2>规则确认与正式结果</h2></div>
          <span className="info-chip">{finalUniversalResult ? '已完成' : activeEvaluationStage === 'universal' ? '进行中' : '开始评测后展开'}</span>
        </summary>

        <div className="universal-review-body">

        <div className="universal-review-path" aria-label="通用评测内部流程">
          <div className={automaticResult ? 'is-complete' : 'is-current'}><span>01</span><strong>自动基础检测</strong><small>{automaticResult ? `${universalDraft?.readiness.lockedAutomaticCount || 0} 条结果已锁定` : '等待导入模型'}</small></div>
          <i>→</i>
          <div className={finalUniversalResult ? 'is-complete' : automaticResult ? 'is-current' : ''}><span>02</span><strong>人工规则确认</strong><small>{universalDraft ? `${universalDraft.readiness.manualConfirmedCount}/${universalDraft.readiness.applicableRuleCount - universalDraft.readiness.lockedAutomaticCount} 条已确认` : '等待自动检测'}</small></div>
          <i>→</i>
          <div className={finalUniversalResult ? 'is-complete' : universalDraft?.readiness.isComplete ? 'is-current' : ''}><span>03</span><strong>正式通用结果</strong><small>{finalUniversalResult ? `${finalUniversalResult.overallScore.toFixed(1)} 分 · ${finalUniversalResult.grade} 级` : '完成全部规则后生成'}</small></div>
        </div>

        <ScoreForm
          rubric={universalRubric}
          rules={universalRules}
          values={resultByRule}
          issues={result?.issues || []}
          mode={evaluationMode}
          selectedDimensionId={selectedDimensionId}
          onDimensionChange={setSelectedDimensionId}
          onChange={automaticResult ? handleManualRuleChange : undefined}
          disabled={activeEvaluationStage !== 'universal' || Boolean(finalUniversalResult)}
        />

        <UniversalCompletionPanel
          draft={universalDraft}
          active={activeEvaluationStage === 'universal'}
          finalResult={finalUniversalResult}
          saveStatus={formalSaveStatus}
          onFinalize={handleFinalizeUniversalResult}
          onSave={handleSaveFormalUniversalResult}
        />
        </div>
      </details>
      </>}

      {pageStage === 'specialized' && <>
      <SpecializedTestSetPanel selectedId={selectedTestCaseId} onSelect={handleSpecializedTestModelSelect} />
      <div className="specialized-primary-workspace" id="specialized-evaluation-workspace">
        <EvaluationStepRail
          stage="specialized"
          modelName={modelName}
          hasModel={Boolean(modelSource)}
          finalUniversalResult={finalUniversalResult}
          finalSpecializedResult={finalSpecializedResult}
          gateResult={gateResult}
          productionContext={productionContext}
          contextLabels={productionContextLabels}
          activeStage={activeEvaluationStage}
          onImport={() => fileInputRef.current?.click()}
          onStartSpecialized={handleStartSpecializedTask}
        />
        <ModelViewer source={modelSource} format={modelFormat} modelName={modelName} onLoad={handleModelLoad} onError={handleModelError} showOverlayControls />
        <aside className="specialized-summary-panel">
          <span>专项评测总览</span>
          <div><strong>{finalSpecializedResult?.overallScore?.toFixed(1) || '—'}</strong><small>/ 100</small></div>
          <StatusCard compact tone={gateResult ? deliveryStatusCopy[gateResult.deliveryStatus].tone : 'neutral'} label={finalUniversalResult ? '交付状态' : '专项状态'} title={gateResult ? deliveryStatusCopy[gateResult.deliveryStatus].name : '等待专项结果'} meta={gateResult ? `${gateResult.blockerCount} 项阻断问题` : '专项分与门槛独立'} />
          <dl>
            <div><dt>通用基础</dt><dd>{finalUniversalResult ? `${finalUniversalResult.overallScore.toFixed(1)} 分` : '未提供 · 不阻断专项'}</dd></div>
            <div><dt>生产目标</dt><dd>{productionContextLabels.target || '未选择'}</dd></div>
            <div><dt>资产类型</dt><dd>{productionContextLabels.assetType || '未选择'}</dd></div>
            <div><dt>平台</dt><dd>{productionContextLabels.platform || '未选择'}</dd></div>
          </dl>
        </aside>
      </div>

      <SpecializedDataStatus analysis={geometryAnalysis} draft={specializedDraft} hasUniversalBaseline={Boolean(finalUniversalResult)} />

      <section className="specialized-task-focus">
        <ProductionContextSelector value={productionContext} onChange={handleProductionContextChange} baseEvaluation={finalUniversalResult} />
        <SpecializedEvaluationPanel
          draft={specializedDraft}
          active={activeEvaluationStage === 'specialized'}
          manualResults={specializedManualResults}
          onChange={handleSpecializedRuleChange}
          finalResult={finalSpecializedResult}
          gateResult={gateResult}
          onFinalize={handleFinalizeSpecializedResult}
          onSave={handleSaveCompleteReport}
          saveStatus={reportSaveStatus}
        />
      </section>
      <RoleInsightPanel stage="specialized" modelName={modelName} modelFormat={modelFormat} result={finalSpecializedResult || specializedDraft?.result || finalUniversalResult} gateResult={gateResult} productionContext={productionContext} />
      </>}
    </div>
  )
}

export default EvaluatePage
