import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iibwbufbshqiaeorwoja.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpYndidWZic2hxaWFlb3J3b2phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA4ODkyOSwiZXhwIjoyMTA1NjY0OTI5fQ.ATJTk9yL22oU2953OB0I956RlxUu2AtW5tdotehyhj0';

const isConfigured = Boolean(supabaseUrl && !supabaseUrl.includes('seu-projeto') && !supabaseUrl.includes('iibwbufbshpiaeonwoja'));

function createDummySupabaseClient(): any {
  const createChainable = (): any => {
    const fn: any = function () {
      return createChainable();
    };

    fn.then = function (onFulfilled: any) {
      return Promise.resolve({ data: [], error: null, count: 0 }).then(onFulfilled);
    };

    return new Proxy(fn, {
      get(target, prop) {
        if (prop === 'then') return target.then;
        return createChainable();
      }
    });
  };

  return createChainable();
}

export const supabaseBrowser = isConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: 'midway_browser_auth',
      },
    })
  : createDummySupabaseClient();
