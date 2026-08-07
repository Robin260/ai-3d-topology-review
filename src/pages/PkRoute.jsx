import { Suspense, lazy } from 'react'

const PkPage = lazy(() => import('./PkPage.jsx'))

function PkRoute() {
  return (
    <Suspense fallback={<div className="route-loading" role="status">正在准备模型 PK 工作台…</div>}>
      <PkPage />
    </Suspense>
  )
}

export default PkRoute
