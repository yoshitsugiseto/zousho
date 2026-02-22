const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Need the service role key, let's grep it:
// grep -A 1 'sb_secret' supabase/config.toml
