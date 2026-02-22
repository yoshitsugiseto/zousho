import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../types/database'
import { Users, UserPlus, Search, Trash2, Mail, User } from 'lucide-react'

export function AdminUsers() {
    const [users, setUsers] = useState<AppUser[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // 招待用ステート
    const [newEmail, setNewEmail] = useState('')
    const [newDisplayName, setNewDisplayName] = useState('')
    const [isInviting, setIsInviting] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            alert('ユーザー一覧の取得に失敗しました。')
        } finally {
            setLoading(false)
        }
    }

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail) return

        setIsInviting(true)
        try {
            const { error } = await supabase.functions.invoke('admin-user-management', {
                body: { action: 'invite', email: newEmail, displayName: newDisplayName }
            })

            if (error) throw error

            alert('招待メールを送信しました。')
            setShowAddModal(false)
            setNewEmail('')
            setNewDisplayName('')
            await fetchUsers()
        } catch (error) {
            console.error('Error inviting user:', error)
            alert('ユーザーの招待に失敗しました。')
        } finally {
            setIsInviting(false)
        }
    }

    const handleDeleteUser = async (user: AppUser) => {
        if (!confirm(`ユーザー「${user.email}」を削除してもよろしいですか？\n※この操作は取り消せません。`)) {
            return
        }

        try {
            const { error } = await supabase.functions.invoke('admin-user-management', {
                body: { action: 'delete', userId: user.id }
            })

            if (error) throw error

            alert('ユーザーを削除しました。')
            await fetchUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('ユーザーの削除に失敗しました。')
        }
    }

    const filteredUsers = users.filter(u =>
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.display_name && u.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-6 lg:max-w-5xl lg:mx-auto">
            {/* ページヘッダー */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">ユーザー管理</h1>
                        <p className="text-sm text-gray-500 mt-1">システムを利用する全ユーザーの管理</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center px-4 py-2.5 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    ユーザーを招待
                </button>
            </div>

            {/* 検索・フィルターエリア */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative max-w-lg w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="メールアドレス、名前で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                    />
                </div>
            </div>

            {/* メインコンテンツ */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    ユーザー情報
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    権限
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    登録日
                                </th>
                                <th scope="col" className="relative px-6 py-4">
                                    <span className="sr-only">アクション</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                            読み込み中...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        一致するユーザーが見つかりません。
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <span className="text-gray-600 font-medium">{user.email?.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.display_name || '-'}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.role === 'admin' ? '管理者' : '一般ユーザー'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors"
                                                    title="削除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 招待モーダル */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto w-screen h-screen">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full my-8 p-6 overflow-hidden">
                        <div className="mb-5 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">ユーザーを招待</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">閉じる</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleInviteUser} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    メールアドレス
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    入力したメールアドレス宛に、パスワード設定用の招待リンクが送信されます。
                                </p>
                            </div>

                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                                    お名前（表示名） <span className="text-gray-400 font-normal">※任意</span>
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="displayName"
                                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                                        value={newDisplayName}
                                        onChange={(e) => setNewDisplayName(e.target.value)}
                                        placeholder="山田 太郎"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={isInviting}
                                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {isInviting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            送信中...
                                        </>
                                    ) : (
                                        '招待メールを送信'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
