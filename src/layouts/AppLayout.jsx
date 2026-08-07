import { NavLink, Outlet } from 'react-router-dom'
import { APP_NAME, APP_SUBTITLE, DEMO_BOUNDARY, NAV_ITEMS } from '../config/appConfig.js'
import './AppLayout.css'

function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/home" aria-label={`${APP_NAME} 首页`}>
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-copy">
            <strong>{APP_NAME}</strong>
            <small>{APP_SUBTITLE}</small>
          </span>
        </NavLink>

        <nav className="primary-nav" aria-label="主要页面">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              <span className="nav-label-full">{item.label}</span>
              <span className="nav-label-short">{item.shortLabel}</span>
            </NavLink>
          ))}
        </nav>

        <div className="phase-badge" title={DEMO_BOUNDARY.description}>
          <span className="phase-dot" aria-hidden="true" />
          {DEMO_BOUNDARY.label}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>TopoLens · AI 3D 评测知识系统</span>
        <span>当前阶段：结构与视觉基线</span>
      </footer>
    </div>
  )
}

export default AppLayout
