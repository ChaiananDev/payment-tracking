import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

export function createServerClient() {
  return createClient(
    isServerSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
    isServerSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
  );
}
