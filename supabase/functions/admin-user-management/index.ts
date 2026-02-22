import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. 環境変数からのキー取得
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

        if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
            throw new Error('Supabase configuration is missing.')
        }

        // 2. リクエスト元の認証確認
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // ユーザー認証用のクライアント
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await userClient.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 3. 管理者権限の確認
        // Service Roleを使った特権クライアントの作成
        const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

        const { data: appUser, error: roleError } = await adminClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (roleError || appUser?.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 4. アクションの実行
        const payload = await req.json()
        const { action, email, userId, displayName } = payload

        if (req.method === 'POST' && action === 'invite') {
            if (!email) throw new Error('Email is required for invite.')
            
            // 招待メールの送信
            const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email)
            if (error) throw error

            if (data.user && displayName) {
                // 自動生成される users テーブルのレコードを更新して displayName を設定
                const { error: updateError } = await adminClient
                    .from('users')
                    .update({ display_name: displayName })
                    .eq('id', data.user.id)
                
                if (updateError) {
                    console.error('Failed to update display_name:', updateError)
                    // エラーにせず招待自体は成功とする
                }
            }

            return new Response(JSON.stringify({ message: 'User invited successfully', data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        } else if (req.method === 'POST' && action === 'delete') {
            if (!userId) throw new Error('UserId is required for deletion.')
            
            // ユーザーの削除
            const { error } = await adminClient.auth.admin.deleteUser(userId)
            if (error) throw error

            return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        return new Response(JSON.stringify({ error: 'Invalid action or method' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
