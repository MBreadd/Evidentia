import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (o VITE_*) en .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const appConfig = {
  supabaseUrl,
  projectRef: import.meta.env.VITE_SUPABASE_PROJECT_REF || '',
  region: import.meta.env.VITE_SUPABASE_REGION || '',
  appUrl: import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
};
