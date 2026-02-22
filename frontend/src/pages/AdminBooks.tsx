import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Book, BookItem, Loan } from '../types/database'
import { Plus, Search, Book as BookIcon, Edit2, CornerUpLeft, Trash2 } from 'lucide-react'

// UI表示用にデータを結合した型
interface BookWithStatus extends Book {
    items: BookItem[]
    activeLoans: (Loan & { user?: { email: string, display_name: string | null } })[] // 貸出中の記録
}

// -----------------------------------------------------------------------------
// 外部API フェッチ用ヘルパー関数群 (コンポーネント外に分離して見通しを良くする)
// -----------------------------------------------------------------------------
interface FetchedBookInfo {
    title: string;
    author: string;
    coverUrl: string;
}

const fetchFromGoogleBooks = async (isbn: string, apiKey: string): Promise<FetchedBookInfo | null> => {
    try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;
        const res = await fetch(url);

        if (!res.ok) {
            if (res.status === 429) console.warn('Google Books API: TOO_MANY_REQUESTS');
            return null;
        }

        const data = await res.json();
        if (!data.items?.length) return null;

        const info = data.items[0].volumeInfo;
        return {
            title: info.title || '',
            author: info.authors ? info.authors.join(', ') : '',
            coverUrl: (info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '').replace(/^http:/, 'https:')
        };
    } catch (err) {
        console.error('Google Books API Error:', err);
        return null; // エラー時はnullを返しフォールバックへ流す
    }
};

const fetchFromOpenBD = async (isbn: string): Promise<FetchedBookInfo | null> => {
    try {
        const url = `https://api.openbd.jp/v1/get?isbn=${isbn}`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        if (!data || !data.length || data[0] === null) return null;

        const info = data[0].summary;
        return {
            title: info.title || '',
            author: info.author || '',
            coverUrl: (info.cover || '').replace(/^http:/, 'https:')
        };
    } catch (err) {
        console.error('OpenBD API Error:', err);
        return null;
    }
};

export function AdminBooks() {
    const [books, setBooks] = useState<BookWithStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // 新規登録用フォームステート
    const [newTitle, setNewTitle] = useState('')
    const [newAuthor, setNewAuthor] = useState('')
    const [newTotalCopies, setNewTotalCopies] = useState(1)
    const [newIsbn, setNewIsbn] = useState('')
    const [newCoverUrl, setNewCoverUrl] = useState('')
    const [isFetchingIsbn, setIsFetchingIsbn] = useState(false)

    useEffect(() => {
        fetchBooks()
    }, [])

    const fetchBooks = async () => {
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

            const { data: loansData, error: err3 } = await supabase
                .from('loans')
                .select('*, user:users(email, display_name)')
                .is('returned_at', null)
            if (err3) throw err3

            const mergedBooks: BookWithStatus[] = (booksData || []).map(b => {
                const bookItems = (itemsData || []).filter(i => i.book_id === b.id)
                const activeLoans = (loansData || []).filter(loan =>
                    bookItems.some(item => item.id === loan.book_item_id)
                )

                return {
                    ...b,
                    items: bookItems,
                    activeLoans
                }
            })

            setBooks(mergedBooks)
        } catch (error) {
            console.error('Error fetching books:', error)
        } finally {
            setLoading(false)
        }
    }

    // 編集モーダルステート
    const [editingBook, setEditingBook] = useState<BookWithStatus | null>(null)
    const [editMode, setEditMode] = useState(false)

    const handleCreateBook = async (e: React.FormEvent) => {
        e.preventDefault()

        const { data: bookData, error: bookError } = await supabase
            .from('books')
            .insert([{
                title: newTitle,
                author: newAuthor,
                total_copies: newTotalCopies,
                isbn: newIsbn || null,
                cover_url: newCoverUrl || null
            }])
            .select()
            .single()

        if (bookError) {
            alert('書籍の登録に失敗しました')
            return
        }

        if (bookData) {
            const itemsToInsert = Array.from({ length: newTotalCopies }).map(() => ({
                book_id: bookData.id,
                status: 'available'
            }))
            await supabase.from('book_items').insert(itemsToInsert)
        }

        setShowAddModal(false)
        setNewTitle('')
        setNewAuthor('')
        setNewTotalCopies(1)
        setNewIsbn('')
        setNewCoverUrl('')
        fetchBooks()
    }

    const handleFetchIsbn = async () => {
        const isbn = newIsbn.trim();
        if (!isbn) return;

        setIsFetchingIsbn(true);
        try {
            const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
            let bookInfo: FetchedBookInfo | null = null;

            // 1. Google Books API を優先的に試す
            if (apiKey) {
                bookInfo = await fetchFromGoogleBooks(isbn, apiKey);
            }

            // 2. Google Booksで見つからなかった場合、OpenBDにフォールバック
            if (!bookInfo?.title) {
                bookInfo = await fetchFromOpenBD(isbn);
            }

            // 3. 結果のGUI（State）への反映
            if (bookInfo?.title) {
                setNewTitle(bookInfo.title);
                if (bookInfo.author) setNewAuthor(bookInfo.author);
                if (bookInfo.coverUrl) setNewCoverUrl(bookInfo.coverUrl);
            } else {
                alert('入力されたISBNの書籍情報が見つかりませんでした。手動で入力してください。');
            }
        } catch (err) {
            console.error('Error in handleFetchIsbn:', err);
            alert('書籍情報の自動取得に失敗しました。手動で入力してください。');
        } finally {
            setIsFetchingIsbn(false);
        }
    }

    const handleUpdateBook = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingBook) return

        const currentTotal = editingBook.items.length
        const newTotal = editingBook.total_copies

        try {
            // 基本情報の更新
            const { error: updateError } = await supabase
                .from('books')
                .update({ title: editingBook.title, author: editingBook.author, total_copies: editingBook.total_copies })
                .eq('id', editingBook.id)
            if (updateError) throw updateError

            // 在庫数の調整
            if (newTotal > currentTotal) {
                const diff = newTotal - currentTotal
                const itemsToInsert = Array.from({ length: diff }).map(() => ({
                    book_id: editingBook.id,
                    status: 'available'
                }))
                await supabase.from('book_items').insert(itemsToInsert)
            } else if (newTotal < currentTotal) {
                const diff = currentTotal - newTotal
                const availableItems = editingBook.items.filter(i => i.status === 'available')
                if (availableItems.length < diff) {
                    alert('削除対象の在庫が不足しています（すでに貸出中の可能性があります）')
                    throw new Error('Insufficient available items to delete')
                }
                const itemsToDelete = availableItems.slice(0, diff).map(i => i.id)
                await supabase.from('book_items').delete().in('id', itemsToDelete)
            }

            setEditMode(false)
            setEditingBook(null)
            fetchBooks()
        } catch (err) {
            console.error('Error updating book:', err)
            alert('更新処理に失敗しました')
        }
    }

    const handleReturn = async (loan: any) => {
        try {
            const { error: loanError } = await supabase
                .from('loans')
                .update({ returned_at: new Date().toISOString() })
                .eq('id', loan.id)
            if (loanError) throw loanError

            const { error: updateError } = await supabase
                .from('book_items')
                .update({ status: 'available' })
                .eq('id', loan.book_item_id)
            if (updateError) throw updateError

            fetchBooks()
        } catch (err) {
            console.error('Error returning book:', err)
            alert('返却エラー')
        }
    }

    const handleDeleteBook = async (bookId: string) => {
        if (!window.confirm('本当にこの書籍を削除してもよろしいですか？\n※すでに貸出中のデータがある場合は削除できません。')) return

        try {
            // 貸出中のアイテムがあるか確認
            const { data: borrowedItems, error: itemsError } = await supabase
                .from('book_items')
                .select('id')
                .eq('book_id', bookId)
                .in('status', ['borrowed', 'lost'])

            if (itemsError) throw itemsError
            if (borrowedItems && borrowedItems.length > 0) {
                alert('現在貸出中、または紛失扱いの在庫があるため、この書籍を削除することはできません。')
                return
            }

            const { error: deleteError } = await supabase
                .from('books')
                .delete()
                .eq('id', bookId)

            if (deleteError) throw deleteError

            fetchBooks()
        } catch (err) {
            console.error('Error deleting book:', err)
            alert('書籍の削除に失敗しました')
        }
    }

    const filteredBooks = books.filter(b => {
        const query = searchQuery.toLowerCase()
        return b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query)
    })

    return (
        <div className="space-y-6">
            <div className="sticky top-16 z-10 bg-gray-50/95 backdrop-blur-sm pb-4 pt-4 -mt-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-gray-200">
                <div className="sm:flex sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">書籍マスタ管理</h1>
                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            新しい書籍を登録
                        </button>
                    </div>
                </div>

                <div className="mt-4 max-w-md relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border bg-white"
                        placeholder="タイトルや著者で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {loading ? (
                    <div className="p-4 text-center text-gray-500">読み込み中...</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredBooks.map((book: BookWithStatus) => (
                            <li key={book.id}>
                                <div className="px-4 py-4 flex items-center sm:px-6">
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-16 w-12 bg-gray-100 rounded overflow-hidden shadow-sm flex items-center justify-center">
                                                {book.cover_url ? (
                                                    <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                                                ) : (
                                                    <BookIcon className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <p className="font-medium text-blue-600 truncate">{book.title}</p>
                                                <p className="mt-1 text-sm text-gray-500">{book.author}</p>
                                                {book.isbn && <p className="text-xs text-gray-400 mt-0.5">ISBN: {book.isbn}</p>}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex-col flex-shrink-0 sm:mt-0 sm:ml-5 text-right space-y-2">
                                            <p className="text-sm text-gray-900">
                                                総冊数: <span className="font-semibold">{book.total_copies}</span> 冊
                                            </p>
                                            {book.activeLoans.length > 0 && (
                                                <div className="text-xs text-orange-600">
                                                    貸出中: {book.activeLoans.length}件
                                                    <div className="mt-1">
                                                        {book.activeLoans.map((loan) => (
                                                            <div key={loan.id} className="flex flex-row items-center justify-end space-x-2">
                                                                <span className="truncate max-w-xs">{loan.user?.display_name || loan.user?.email}</span>
                                                                <button
                                                                    onClick={() => handleReturn(loan)}
                                                                    className="px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-sm border border-green-200 transition-colors"
                                                                >
                                                                    <CornerUpLeft className="h-3 w-3 inline mr-1" />
                                                                    返却
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-end space-x-2 mt-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingBook(book)
                                                        setEditMode(true)
                                                    }}
                                                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <Edit2 className="h-3 w-3 mr-1" />
                                                    編集
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBook(book.id)}
                                                    className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    削除
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {filteredBooks.length === 0 && !loading && (
                            <li className="p-4 text-center text-gray-500">書籍が見つかりませんでした。</li>
                        )}
                    </ul>
                )}
            </div>

            {/* 新規追加モーダル (シンプル実装) */}
            {
                showAddModal && (
                    <div className="fixed z-20 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowAddModal(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="relative z-30 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">書籍の新規登録</h3>
                                    <form onSubmit={handleCreateBook} className="mt-5 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">ISBNから自動入力</label>
                                            <div className="mt-1 flex rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 py-2 px-3 border"
                                                    placeholder="例: 9784873117584"
                                                    value={newIsbn}
                                                    onChange={e => setNewIsbn(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleFetchIsbn}
                                                    disabled={isFetchingIsbn || !newIsbn.trim()}
                                                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                                >
                                                    {isFetchingIsbn ? '取得中...' : '取得'}
                                                </button>
                                            </div>
                                        </div>
                                        {newCoverUrl && (
                                            <div className="flex justify-center mt-2">
                                                <img src={newCoverUrl} alt="Cover Preview" className="h-24 object-contain shadow-sm rounded border border-gray-200" />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">タイトル <span className="text-red-500">*</span></label>
                                            <input type="text" required className="mt-1 border block w-full shadow-sm sm:text-sm border-gray-300 py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">著者 <span className="text-red-500">*</span></label>
                                            <input type="text" required className="mt-1 border block w-full shadow-sm sm:text-sm border-gray-300 py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">登録冊数（初期在庫数） <span className="text-red-500">*</span></label>
                                            <input type="number" min="1" required className="mt-1 border block w-full shadow-sm sm:text-sm border-gray-300 py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500" value={newTotalCopies} onChange={e => setNewTotalCopies(parseInt(e.target.value))} />
                                        </div>
                                        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                                            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                                                登録する
                                            </button>
                                            <button type="button" onClick={() => setShowAddModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm">
                                                キャンセル
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 編集モーダル */}
            {
                editMode && editingBook && (
                    <div className="fixed z-20 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => { setEditMode(false); setEditingBook(null) }}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="relative z-30 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">書籍の編集</h3>
                                    <form onSubmit={handleUpdateBook} className="mt-5 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">タイトル</label>
                                            <input type="text" required className="mt-1 border block w-full shadow-sm sm:text-sm border-gray-300 py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500" value={editingBook.title} onChange={e => setEditingBook({ ...editingBook, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">著者</label>
                                            <input type="text" required className="mt-1 border block w-full shadow-sm sm:text-sm border-gray-300 py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500" value={editingBook.author} onChange={e => setEditingBook({ ...editingBook, author: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">総冊数</label>
                                            <input type="number" min="1" required className="mt-1 border block w-full shadow-sm sm:text-sm border-gray-300 py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500" value={editingBook.total_copies} onChange={e => setEditingBook({ ...editingBook, total_copies: parseInt(e.target.value) })} />
                                            <p className="mt-1 text-xs text-gray-500">※冊数を減らす際は返却済みの在庫が必要です。</p>
                                        </div>
                                        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                                            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                                                更新する
                                            </button>
                                            <button type="button" onClick={() => { setEditMode(false); setEditingBook(null) }} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm">
                                                キャンセル
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    )
}
