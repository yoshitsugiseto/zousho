const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3ODYxMjk4MiwiZXhwIjoxOTkzOTcyOTgyfQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'password123',
    });
    console.log('SignIn Result:', { data, error });
}

testAuth();
