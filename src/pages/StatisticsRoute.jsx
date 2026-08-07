import { Suspense, lazy } from 'react'

const StatisticsPage = lazy(() => import('./StatisticsPage.jsx'))

function StatisticsRoute() {
  return (
    <Suspense fallback={<div className="route-loading" role="status">正在准备评测分析看板…</div>}>
      <StatisticsPage />
    </Suspense>
  )
}

export default StatisticsRoute
