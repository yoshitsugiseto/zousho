import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { Login } from './pages/Login'
import { SetupAccount } from './pages/SetupAccount'
import { VerifyMfa } from './pages/VerifyMfa'
import { Dashboard } from './pages/Dashboard'
import { AdminBooks } from './pages/AdminBooks'
import { AdminUsers } from './pages/AdminUsers'
import { Manual } from './pages/Manual'
import { ProtectedLayout } from './components/ProtectedLayout'
import { AdminRoute } from './components/AdminRoute'
import { useAuth } from './hooks/useAuth'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <Login />}
        />

        {/* ログイン必須 */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/setup" element={<SetupAccount />} />
          <Route path="/verify-mfa" element={<VerifyMfa />} />
          <Route path="/manual" element={<Manual />} />

          {/* 管理者権限必須 */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/books" element={<AdminBooks />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App
