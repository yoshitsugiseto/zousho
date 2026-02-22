import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Book, BookItem, Loan, ReadingStatus } from '../types/database'
import { useAuth } from '../hooks/useAuth'
import { Search, Book as BookIcon, CheckCircle, XCircle, ChevronDown } from 'lucide-react'

// UI表示用にデータを結合した型
interface BookWithStatus extends Book {
    items: BookItem[]
    availableCount: number
    myActiveLoans: Loan[] // 自分が現在借りている記録
    myReadingStatus?: ReadingStatus // 自分の読書状況
}

export function Dashboard() {
    const { appUser, loading: authLoading } = useAuth()
    const [books, setBooks] = useState<BookWithStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) return // 認証状態の読み込み中は待機
        if (appUser) {
            fetchLibraryData()
        } else {
            // appUserが存在しない（DB不整合など）場合、ローディングを解除
            setLoading(false)
        }
    }, [appUser, authLoading])

    const fetchLibraryData = async () => {
        setLoading(true)

        try {
            const { data: booksData, error: err1 } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false })
            if (err1) throw err1

            const { data: itemsData, error: err2 } = await supabase
                .from('book_items')
                .select('*')
            if (err2) throw err2

            const { data: myLoansData, error: err3 } = await supabase
                .from('loans')
                .select('*')
                .eq('user_id', appUser!.id)
                .is('returned_at', null)
            if (err3) throw err3

            // 4. 個人の読書状況を取得
            const { data: myReadingData, error: err4 } = await supabase
                .from('reading_statuses')
                .select('*')
                .eq('user_id', appUser!.id)
            if (err4) throw err4

            const mergedBooks: BookWithStatus[] = (booksData || []).map(b => {
                const bookItems = (itemsData || []).filter(i => i.book_id === b.id)
                const availableCount = bookItems.filter(i => i.status === 'available').length
                const myActiveLoans = (myLoansData || []).filter(loan =>
                    bookItems.some(item => item.id === loan.book_item_id)
                )
                const myReadingStatus = (myReadingData || []).find(r => r.book_id === b.id)

                return {
                    ...b,
                    items: bookItems,
                    availableCount,
                    myActiveLoans,
                    myReadingStatus
                }
            })

            setBooks(mergedBooks)
        } catch (error) {
            console.error('Error fetching library data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleBorrow = async (book: BookWithStatus) => {
        if (!appUser) return
        setActionLoading(book.id)

        try {
            const availableItem = book.items.find(i => i.status === 'available')
            if (!availableItem) return

            const { error: loanError } = await supabase
                .from('loans')
                .insert([{ book_item_id: availableItem.id, user_id: appUser.id }])
            if (loanError) throw loanError

            const { error: updateError } = await supabase
                .from('book_items')
                .update({ status: 'borrowed' })
                .eq('id', availableItem.id)
            if (updateError) throw updateError

            // 借りたときに、自動で読書ステータスを「読書中(reading)」にする気の利いた処理
            if (!book.myReadingStatus || book.myReadingStatus.status === 'unread') {
                const { error: readError } = await supabase
                    .from('reading_statuses')
                    .upsert({ user_id: appUser.id, book_id: book.id, status: 'reading' })
                if (readError) console.error(readError)
            }

            await fetchLibraryData()
        } catch (error) {
            console.error('Error borrowing book:', error)
            alert('貸出処理に失敗しました。')
        } finally {
            setActionLoading(null)
        }
    }



    // 読書ステータスの変更
    const handleReadingStatusChange = async (book: BookWithStatus, newStatus: string) => {
        if (!appUser) return
        setActionLoading(`status_${book.id}`) // ステータス変更中のローディング識別子

        try {
            const { error } = await supabase
                .from('reading_statuses')
                .upsert({
                    user_id: appUser.id,
                    book_id: book.id,
                    status: newStatus
                }, {
                    onConflict: 'user_id,book_id'
                })
            if (error) throw error

            await fetchLibraryData()
        } catch (error) {
            console.error('Error updating reading status:', error)
            alert('読書状況の更新に失敗しました。')
        } finally {
            setActionLoading(null)
        }
    }

    const filteredBooks = books.filter(b =>
        b.title.includes(searchQuery) || b.author.includes(searchQuery)
    )

    const readingStatusOptions = [
        { value: 'unread', label: '未読' },
        { value: 'reading', label: '読書中' },
        { value: 'read', label: '読了' }
    ]

    return (
        <div className="space-y-6 lg:max-w-5xl lg:mx-auto">
            <div className="sm:flex sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">みんなの本棚</h1>
            </div>

            <div className="relative rounded-md shadow-sm xl:w-1/2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 shadow-sm border"
                    placeholder="本のタイトルや著者で探す..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading || authLoading ? (
                <div className="flex justify-center items-center py-20 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    読み込み中...
                </div>
            ) : !appUser ? (
                <div className="flex flex-col justify-center items-center py-20 text-red-500 bg-red-50 rounded-xl border border-red-100">
                    <XCircle className="mx-auto h-12 w-12 text-red-400 mb-3" />
                    <p className="font-medium text-lg">ユーザー情報が見つかりません</p>
                    <p className="text-sm text-red-400 mt-2">データベースのユーザー管理テーブルに登録がありません。</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredBooks.map((book) => {
                        const isBorrowing = book.myActiveLoans.length > 0
                        const canBorrow = !isBorrowing && book.availableCount > 0
                        const isCardLoading = actionLoading === book.id || actionLoading === `status_${book.id}`
                        const currentStatus = book.myReadingStatus?.status || 'unread'

                        return (
                            <div key={book.id} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                                <div className="p-5 flex-1 relative">
                                    {/* ロード中のオーバーレイ */}
                                    {isCardLoading && (
                                        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 transition-opacity">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between">
                                        <div className="flex-shrink-0 h-16 w-12 bg-blue-50 rounded overflow-hidden shadow-inner flex items-center justify-center -mt-2 -ml-2 mb-4">
                                            {book.cover_url ? (
                                                <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                                            ) : (
                                                <BookIcon className="h-6 w-6 text-blue-300" />
                                            )}
                                        </div>
                                        {isBorrowing ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                貸出中（あなた）
                                            </span>
                                        ) : book.availableCount > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                在庫あり ({book.availableCount}/{book.total_copies})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                貸出中・在庫なし
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{book.title}</h3>
                                    <p className="text-sm text-gray-500 mb-6">{book.author}</p>
                                </div>

                                {appUser?.role !== 'admin' && (
                                    <div className="bg-gray-50 flex flex-col border-t border-gray-100 mt-auto">
                                        {/* 読書ステータス選択 */}
                                        <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-white">
                                            <span className="text-xs font-medium text-gray-500">あなたの読書状況</span>
                                            <div className="relative">
                                                <select
                                                    value={currentStatus}
                                                    onChange={(e) => handleReadingStatusChange(book, e.target.value)}
                                                    disabled={isCardLoading}
                                                    className={`appearance-none text-sm font-medium pr-8 pl-3 py-1 rounded-full outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer border
                            ${currentStatus === 'read' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                            currentStatus === 'reading' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                'bg-gray-100 text-gray-600 border-gray-200'}`}
                                                >
                                                    {readingStatusOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2.5 top-1.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* アクションボタン */}
                                        <div className="px-5 py-3">
                                            {isBorrowing ? (
                                                <div className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-500 bg-white cursor-not-allowed">
                                                    返却は管理者へ
                                                </div>
                                            ) : canBorrow ? (
                                                <button
                                                    onClick={() => handleBorrow(book)}
                                                    disabled={isCardLoading}
                                                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                                >
                                                    本を借りる
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                                                >
                                                    貸出できません
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {filteredBooks.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            <BookIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                            <p>該当する本が見つかりませんでした。</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
