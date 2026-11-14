const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. In-memory demo fallback will be used if database calls fail.');
}

// Service role client for privileged backend operations (bypasses RLS strictly on verified backend endpoints)
const supabaseAdmin = createClient(
  env.SUPABASE_URL || 'https://careloop-demo.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role_key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Anonymous client for token authentication validation
const supabaseAnon = createClient(
  env.SUPABASE_URL || 'https://careloop-demo.supabase.co',
  env.SUPABASE_ANON_KEY || 'dummy_anon_key'
);

module.exports = {
  supabaseAdmin,
  supabaseAnon
};
