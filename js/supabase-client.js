// Lazily creates the Supabase client only when the site is configured,
// so demo mode works fully offline.
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './config.js';

let clientPromise = null;

export function getSupabase() {
  if (!isConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY),
    );
  }
  return clientPromise;
}
