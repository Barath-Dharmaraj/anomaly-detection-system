import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import PredictPage from '@/pages/PredictPage'
import UploadPage from '@/pages/UploadPage'
import HistoryPage from '@/pages/HistoryPage'
import AdminPage from '@/pages/AdminPage'

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}
function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}
export default function App() {
  const initAuth = useAuthStore(s => s.initAuth)
  useEffect(() => { initAuth() }, [initAuth])
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style:{background:'#111',color:'#f0f0f0',border:'1px solid #2a2a2a'}, success:{iconTheme:{primary:'#22c55e',secondary:'#111'}}, error:{iconTheme:{primary:'#ff3b3b',secondary:'#111'}} }}/>
      <Routes>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="predict"   element={<PredictPage />} />
          <Route path="upload"    element={<UploadPage />} />
          <Route path="history"   element={<HistoryPage />} />
          <Route path="admin"     element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
