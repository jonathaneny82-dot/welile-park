import { createClient } from '@supabase/supabase-js';

// Read Supabase environment variables for server and client side
const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  import.meta.env?.VITE_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Lazy initialization wrapper to avoid startup crashes if keys are missing
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');
