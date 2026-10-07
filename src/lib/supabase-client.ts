import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isConfigured = Boolean(supabaseUrl && !supabaseUrl.includes('seu-projeto') && !supabaseUrl.includes('iibwbufbshqiaeorwoja') && !supabaseUrl.includes('iibwbufbshpiaeonwoja'));

export const supabaseBrowser = isConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: 'midway_browser_auth',
      },
    })
  : ({
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            order: () => Promise.resolve({ data: [], error: null }),
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
          in: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      channel: () => ({
        on: () => ({
          subscribe: () => ({}),
        }),
        subscribe: () => ({}),
      }),
      removeChannel: () => {},
    } as any);
