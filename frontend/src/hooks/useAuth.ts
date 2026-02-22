import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../types/database'

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [appUser, setAppUser] = useState<AppUser | null>(null) // usersテーブルの情報
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const fetchAppUser = async (userId: string) => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (error) {
                    console.error('Error fetching app user:', error)
                } else if (mounted) {
                    setAppUser(data)
                }
            } catch (err) {
                console.error('Exception in fetchAppUser:', err)
            }
        }

        const initializeAuth = async () => {
            try {
                // getSessionがローカルストレージのロック等で無限に待機するのを防ぐ
                const sessionPromise = supabase.auth.getSession()
                const timeoutPromise = new Promise<{ data: { session: Session | null }, error: any }>((resolve) =>
                    setTimeout(() => resolve({ data: { session: null }, error: new Error('getSession timeout') }), 2000)
                )

                const { data } = await Promise.race([sessionPromise, timeoutPromise])
                const session = data?.session

                if (mounted && session) {
                    setSession(session)
                    setUser(session.user)
                    await fetchAppUser(session.user.id)
                }
            } catch (err) {
                console.error('Error in initializeAuth:', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        // 初期ロードを確実に走らせる
        initializeAuth()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (mounted) {
                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (newSession?.user) {
                    // 非同期でユーザー情報を取得（ローディングブロックしない）
                    fetchAppUser(newSession.user.id)
                } else {
                    setAppUser(null)
                    setLoading(false) // ログアウト時は即座にローディング解除
                }
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    return { session, user, appUser, loading }
}
