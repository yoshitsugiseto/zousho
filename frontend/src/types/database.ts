export type UserRole = 'admin' | 'user'

export interface AppUser {
    id: string
    role: UserRole
    display_name: string | null
    email: string | null
    created_at: string
}

export interface Book {
    id: string
    title: string
    author: string
    isbn: string | null
    cover_url: string | null
    total_copies: number
    created_at: string
}

export type BookItemStatus = 'available' | 'borrowed' | 'lost'

export interface BookItem {
    id: string
    book_id: string
    status: BookItemStatus
    created_at: string
}

export interface Loan {
    id: string
    book_item_id: string
    user_id: string
    borrowed_at: string
    returned_at: string | null
    created_at: string
}

export type ReadingStatusType = 'unread' | 'reading' | 'read'

export interface ReadingStatus {
    id: string
    user_id: string
    book_id: string
    status: ReadingStatusType
    updated_at: string
}
