import { Link } from 'react-router-dom'
import { Button } from '../components/ui/index.js'
import { DEMO_BOUNDARY } from '../config/appConfig.js'
import { universalRubric, universalRules } from '../config/rule.js'
import './pages.css'

const evaluationFlow = [
  { step: '01', title: '导入模型', detail: 'GLB · GLTF · OBJ · FBX', state: '会话预览' },
  { step: '02', title: '通用标准测评', detail: '所有模型必须先经过', state: '当前基线' },
  { step: '03', title: '选择生产流程', detail: '目标 · 资产 · 阶段 · 平台', state: '专项入口' },
  { step: '04', title: '专项模型测评', detail: '加载对应生产规则', state: '可扩展' },
  { step: '05', title: '门槛与报告', detail: '质量分与交付状态分开', state: '统一结论' },
  { step: '06', title: '协作与分析', detail: 'PK · 岗位反馈 · 统计', state: '持续优化' },
]

const systemModules = [
  {
    index: 'A',
    title: '评测标准与知识框架',
    description: '查看整套评测体系、通用标准、专项扩展方式和硬性门槛原则。',
    meta: '系统总览 · 当前页面',
    to: '/home',
    status: '已建立',
  },
  {
    index: 'B',
    title: '单模型质量评测',
    description: '导入一个低模，查看 3D 模型、七维质量分、问题证据和修改建议。',
    meta: '通用 → 专项 → 报告',
    to: '/evaluate',
    status: '框架可用',
  },
  {
    index: 'C',
    title: '双模型 PK 对比',
    description: '复用同一套评测结果，比较公平性、质量差异、阻断问题和适用场景。',
    meta: 'Comparison Layer',
    to: '/pk',
    status: '待细化',
  },
  {
    index: 'D',
    title: '历史记录与统计分析',
    description: '汇总评测记录，观察版本趋势、常见缺陷、质量分布和算法改进方向。',
    meta: 'localStorage · Recharts',
    to: '/statistics',
    status: '待细化',
  },
]

const knowledgeLayers = [
  { label: '第一层', title: '通用基础标准', text: '不区分用途，先检查网格是否健康、形体是否保留、拓扑是否合理。', tone: 'primary' },
  { label: '第二层', title: '专项生产标准', text: '选择游戏、动画、展示等生产流程后，再加入资产类型、平台和流程阶段要求。', tone: 'neutral' },
  { label: '独立判断', title: '硬性门槛', text: '不修改原始质量分；严重问题单独决定模型当前能否进入下一生产阶段。', tone: 'warning' },
  { label: '解释输出', title: '岗位反馈', text: '把同一结果分别解释给模型师、TA、算法、数据和产品人员。', tone: 'success' },
]

function HomePage() {
  return (
    <div className="page-stack system-overview-page">
      <section className="overview-hero">
        <div>
          <div className="eyebrow"><span />AI 3D TOPOLOGY EVALUATION SYSTEM</div>
          <h1>AI 3D 拓扑低模评测<br />Web 系统总览</h1>
          <p className="hero-description">
            这里不是单独的一张评分表，而是整个系统的入口地图。它展示模型从导入、通用检查、专项判断，
            到交付结论、模型 PK 和数据分析的完整关系。
          </p>
          <div className="hero-actions">
            <Button as={Link} to="/evaluate" iconAfter={<span>→</span>}>进入单模型评测</Button>
            <Button as="a" variant="secondary" href="#system-map">查看完整结构</Button>
          </div>
        </div>
        <div className="overview-hero__metrics" aria-label="当前系统框架数据">
          <div><strong>1</strong><span>套通用基线</span></div>
          <div><strong>{universalRubric.dimensions.length}</strong><span>个质量维度</span></div>
          <div><strong>{universalRules.length}</strong><span>条基础规则</span></div>
          <div><strong>4</strong><span>个主要入口</span></div>
        </div>
      </section>

      <section className="section-block overview-section" id="system-map">
        <div className="section-heading">
          <div>
            <span className="section-kicker">完整评测路径</span>
            <h2>一个模型进入系统后，会经历什么？</h2>
          </div>
          <span className="info-chip">先通用 · 后专项</span>
        </div>
        <div className="system-flow" aria-label="模型评测完整流程">
          {evaluationFlow.map((item, index) => (
            <article className={index === 1 ? 'system-flow__item is-current' : 'system-flow__item'} key={item.step}>
              <div className="system-flow__top"><span>{item.step}</span><small>{item.state}</small></div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              {index < evaluationFlow.length - 1 && <i aria-hidden="true">→</i>}
            </article>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">知识体系层级</span>
            <h2>评分、门槛和解释各自负责什么？</h2>
          </div>
        </div>
        <div className="knowledge-layer-grid">
          {knowledgeLayers.map((layer) => (
            <article className={`knowledge-layer-card is-${layer.tone}`} key={layer.title}>
              <span>{layer.label}</span>
              <h3>{layer.title}</h3>
              <p>{layer.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Web 功能入口</span>
            <h2>四个页面，共用同一套评测数据</h2>
          </div>
          <span className="info-chip">模块可持续扩展</span>
        </div>
        <div className="module-map-grid">
          {systemModules.map((module) => (
            <Link className="module-map-card" to={module.to} key={module.index}>
              <div className="module-map-card__top">
                <span className="module-index">{module.index}</span>
                <span className="module-status">{module.status}</span>
              </div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <div className="module-map-card__footer"><span>{module.meta}</span><strong>进入 →</strong></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="overview-data-bridge">
        <div>
          <span className="section-kicker">统一结果数据</span>
          <h2>评测一次，多处复用</h2>
          <p>单模型评测生成同一份结果；PK 负责比较，统计负责汇总，岗位模块负责解释，它们都不能反向修改原始评分。</p>
        </div>
        <div className="data-bridge-flow" aria-label="统一评测数据复用关系">
          <span>单模型结果</span><i>→</i><span>模型 PK</span><i>→</i><span>历史统计</span><i>→</i><span>岗位反馈</span>
        </div>
      </section>

      <section className="boundary-note">
        <span className="boundary-icon">i</span>
        <div><strong>哪些已经能用，哪些仍是规划？</strong><p>{DEMO_BOUNDARY.description} 页面上的状态标签会明确区分“已建立”“框架可用”和“待细化”。</p></div>
      </section>
    </div>
  )
}

export default HomePage
