// =============================================================
//  BACKEND CONFIG
//  Leave both values empty to run in DEMO MODE: the page shows
//  sample memories and the form does not save anything.
//
//  When you create a Supabase project, copy these from
//  Project Settings → API. The anon key is safe to publish:
//  access is enforced by Row Level Security (see supabase/schema.sql).
// =============================================================

export const SUPABASE_URL = '';      // e.g. 'https://abcd1234.supabase.co'
export const SUPABASE_ANON_KEY = ''; // e.g. 'eyJhbGciOi...'

export const PHOTO_BUCKET = 'memory-photos';
export const MAX_PHOTO_MB = 5;
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
