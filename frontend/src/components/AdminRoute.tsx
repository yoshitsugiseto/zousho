import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AdminRoute() {
    const { session, appUser, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    // 未ログイン、またはログインしているが admin ではない場合はアクセスを弾く
    if (!session || appUser?.role !== 'admin') {
        return <Navigate to="/" replace />
    }

    // 管理者の場合は子ルート（Outlet）を表示
    return <Outlet />
}
