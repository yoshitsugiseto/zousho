const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:54321', process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3ODYxMjk4MiwiZXhwIjoxOTkzOTcyOTgyfQ');

async function testAuth() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'password123',
  });
  console.log('SignIn:', { data, error });
}
testAuth();
