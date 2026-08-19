import { Navigate, createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout.jsx'
import HomePage from '../pages/HomePage.jsx'
import EvaluateRoute from '../pages/EvaluateRoute.jsx'
import PkRoute from '../pages/PkRoute.jsx'
import StatisticsRoute from '../pages/StatisticsRoute.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'evaluate', element: <Navigate to="/evaluate/universal" replace /> },
      { path: 'evaluate/:evaluationStage', element: <EvaluateRoute /> },
      { path: 'pk', element: <PkRoute /> },
      { path: 'statistics', element: <StatisticsRoute /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
