import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
    },
  }
)

// Debug: Log Supabase configuration
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase client initialized with:');
  console.log('- URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('- Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}


