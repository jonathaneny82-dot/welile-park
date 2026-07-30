import { createClient, SupabaseClient } from '@supabase/supabase-js';

const initialUrl = import.meta.env.VITE_SUPABASE_URL || '';
const initialKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export let isSupabaseConfigured = Boolean(
  initialUrl && initialKey && !initialUrl.includes('placeholder')
);

export let supabase: SupabaseClient = createClient(
  initialUrl || 'https://placeholder.supabase.co',
  initialKey || 'placeholder-anon-key'
);

export function getClientSupabase(): SupabaseClient {
  return supabase;
}

export function checkIsSupabaseConfigured(): boolean {
  return isSupabaseConfigured;
}

// Self-healing runtime fetch for Supabase client credentials from backend if VITE_ env was not baked into build
if (!isSupabaseConfigured && typeof window !== 'undefined') {
  fetch('/api/supabase/config')
    .then((res) => res.json())
    .then((cfg) => {
      if (cfg.supabaseUrl && cfg.supabaseAnonKey && !cfg.supabaseUrl.includes('placeholder')) {
        supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        isSupabaseConfigured = true;
        console.log('✅ Client Supabase runtime client dynamically connected to:', cfg.supabaseUrl);
      }
    })
    .catch((err) => {
      console.warn('Runtime Supabase config fetch error:', err);
    });
}

