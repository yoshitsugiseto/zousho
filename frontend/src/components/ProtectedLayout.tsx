import { useEffect } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Book, LayoutDashboard, Users, HelpCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function ProtectedLayout() {
    const { session, appUser, loading } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const checkMfa = async () => {
            if (!session || !appUser) return
            // 管理者はMFA不要
            if (appUser.role === 'admin') return

            const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

            if (data?.currentLevel === 'aal1') {
                if (data.nextLevel === 'aal1') {
                    // MFA未設定 -> セットアップへ強制
                    if (location.pathname !== '/setup') navigate('/setup')
                } else if (data.nextLevel === 'aal2') {
                    // MFA設定済みだが未認証 -> 検証画面へ強制
                    if (location.pathname !== '/verify-mfa') navigate('/verify-mfa')
                }
            }
        }

        if (!loading) {
            checkMfa()
        }
    }, [session, appUser, location.pathname, navigate, loading])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 共通ヘッダー */}
            <nav className="bg-white border-b border-gray-200 shadow-sm z-20 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-extrabold tracking-tight text-blue-600">
                                    Zousho<span className="text-gray-900 font-medium ml-1 text-base">蔵書管理</span>
                                </span>
                            </div>
                            <div className="hidden sm:-my-px sm:ml-8 sm:flex sm:space-x-8">
                                <Link
                                    to="/"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${location.pathname === '/'
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <LayoutDashboard className="w-4 h-4 mr-2" />
                                    ダッシュボード
                                </Link>


                                {appUser?.role === 'admin' && (
                                    <>
                                        <Link
                                            to="/admin/books"
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${location.pathname.startsWith('/admin/books')
                                                ? 'border-blue-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <Book className="w-4 h-4 mr-2" />
                                            書籍管理
                                        </Link>
                                        <Link
                                            to="/admin/users"
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${location.pathname.startsWith('/admin/users')
                                                ? 'border-blue-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            ユーザー管理
                                        </Link>
                                    </>
                                )}

                                <Link
                                    to="/manual"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${location.pathname === '/manual'
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    使い方（マニュアル）
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 flex items-center">
                                {appUser?.role === 'admin' && (
                                    <span className="mr-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                        Administrator
                                    </span>
                                )}
                                <span className="hidden sm:inline-block">{appUser?.display_name || session.user.email}</span>
                            </span>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none transition-all duration-200"
                                title="ログアウト"
                            >
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline-block">ログアウト</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* メインコンテンツ エリア */}
            <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    )
}
