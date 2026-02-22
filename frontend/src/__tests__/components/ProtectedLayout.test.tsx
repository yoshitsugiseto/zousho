import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedLayout } from '../../components/ProtectedLayout'
import * as useAuthHook from '../../hooks/useAuth'

// useAuth フックをモック化
vi.mock('../../hooks/useAuth')

describe('ProtectedLayout', () => {
    it('ローディング中はスピナーが表示されること', () => {
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            loading: true,
            session: null,
            user: null,
            appUser: null,
        })

        const { container } = render(
            <MemoryRouter>
                <ProtectedLayout />
            </MemoryRouter>
        )

        // スピナー用のクラスを持つ要素が存在するか確認
        expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('未ログイン時はログイン画面にリダイレクトされること', () => {
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            loading: false,
            session: null,
            user: null,
            appUser: null,
        })

        render(
            <MemoryRouter initialEntries={['/']}>
                <ProtectedLayout />
            </MemoryRouter>
        )

        // Navigate によって何もレンダリングされない（または特定の要素がない）ことを確認
        // 実際の遷移先はテストルート設定によって確認することも可能
        expect(screen.queryByText('蔵書管理システム')).not.toBeInTheDocument()
    })

    it('一般ユーザーとしてログインしている場合、ヘッダーにダッシュボードが表示されること', () => {
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            loading: false,
            session: { user: { id: '1', email: 'user@example.com' } } as any,
            user: { id: '1', email: 'user@example.com' } as any,
            appUser: { id: '1', role: 'user', display_name: 'Test', email: 'user@example.com', created_at: '' },
        })

        render(
            <MemoryRouter>
                <ProtectedLayout />
            </MemoryRouter>
        )

        expect(screen.getByText('Zousho')).toBeInTheDocument()
        expect(screen.getByText('ダッシュボード')).toBeInTheDocument()
        expect(screen.getByText('user@example.com')).toBeInTheDocument()

        // 書籍管理（管理者メニュー）は表示されないはず
        expect(screen.queryByText('書籍管理')).not.toBeInTheDocument()
    })

    it('管理者としてログインしている場合、ヘッダーに書籍管理メニューとAdminバッジが表示されること', () => {
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            loading: false,
            session: { user: { id: '1', email: 'admin@example.com' } } as any,
            user: { id: '1', email: 'admin@example.com' } as any,
            appUser: { id: '1', role: 'admin', display_name: 'Admin', email: 'admin@example.com', created_at: '' },
        })

        render(
            <MemoryRouter>
                <ProtectedLayout />
            </MemoryRouter>
        )

        expect(screen.getByText('書籍管理')).toBeInTheDocument()
        expect(screen.getByText('Administrator')).toBeInTheDocument()
    })
})
