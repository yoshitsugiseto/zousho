const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3ODYxMjk4MiwiZXhwIjoxOTkzOTcyOTgyfQ';
// 権限が必要なためservice_roleキーを使用する
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function registerTestUsers() {
    console.log('Registering test users...');

    const users = [
        { email: 'admin@example.com', password: 'password123', meta: { full_name: '管理者テストユーザー' } },
        { email: 'user@example.com', password: 'password123', meta: { full_name: '一般テストユーザー' } }
    ];

    for (const u of users) {
        // ユーザーリストからIDを検索
        const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
        const existing = allUsers.find(x => x.email === u.email);

        let adminData;
        if (existing) {
            // 存在する場合はパスワードを強制上書き
            await supabase.auth.admin.updateUserById(existing.id, { password: u.password });
            console.log(`Updated password for existing user: ${u.email}`);
            adminData = { user: existing };
        } else {
            // 存在しない場合は新規作成
            const { data, error } = await supabase.auth.admin.createUser({
                email: u.email,
                password: u.password,
                email_confirm: true,
                user_metadata: u.meta
            });
            if (error) console.error('Error creating user', error);
            adminData = data;
            console.log(`Created new user ${u.email}:`, adminData?.user?.id);
        }

        // public.usersにも存在するか確認し、なければ作成・adminのrole付与
        if (adminData?.user?.id) {
            await supabase.from('users').upsert({
                id: adminData.user.id,
                email: u.email,
                display_name: u.meta.full_name,
                role: u.email.includes('admin') ? 'admin' : 'user'
            });
            console.log(`Updated public.users for ${u.email}`);
        }
    }
}

registerTestUsers().catch(console.error);
