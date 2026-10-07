import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isConfigured = Boolean(supabaseUrl && !supabaseUrl.includes('seu-projeto') && !supabaseUrl.includes('iibwbufbshqiaeorwoja') && !supabaseUrl.includes('iibwbufbshpiaeonwoja'));

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
