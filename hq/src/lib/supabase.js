import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zjgxafxajnndfwolvvjs.supabase.co';
// Publishable key: safe in the browser. Row Level Security keeps the data
// private to the emails listed in the admins table.
const SUPABASE_KEY = 'sb_publishable_tuCbIue2qURSNZY7iaJKYA_rkEfjPEe';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Calls an edge function as the signed-in admin. */
async function callFunction(name, action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const stripeAction = (action, payload) => callFunction('stripe', action, payload);
export const newsletterAction = (action, payload) => callFunction('newsletter', action, payload);
export const opsAction = (action, payload) => callFunction('ops', action, payload);
