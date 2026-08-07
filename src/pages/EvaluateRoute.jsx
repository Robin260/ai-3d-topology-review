import { lazy, Suspense } from 'react'

const EvaluatePage = lazy(() => import('./EvaluatePage.jsx'))

function EvaluateRoute() {
  return (
    <Suspense fallback={<div className="route-loading" role="status">正在准备 3D 工作台…</div>}>
      <EvaluatePage />
    </Suspense>
  )
}

export default EvaluateRoute
