// All website forms post to the Supabase "leads" edge function, which saves the
// person to the contacts table (visible in TrueLink HQ) and sends any emails.
const FUNCTIONS_URL =
  import.meta.env.VITE_FUNCTIONS_URL || 'https://zjgxafxajnndfwolvvjs.supabase.co/functions/v1';

async function post(path, payload) {
  let res;
  try {
    res = await fetch(`${FUNCTIONS_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("We couldn't reach the server. Please check your connection and try again.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // fall through to the generic error below
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Something went wrong. Please try again.');
  }
  return data;
}

/** Newsletter / free tips signup. */
export function signup({ name, email, company_website = '' }) {
  return post('/leads/capture', { type: 'newsletter', name, email, company_website });
}

/** Free 15-minute audit request. */
export function requestAudit({ name, email, phone, business_name, message, company_website = '' }) {
  return post('/leads/capture', { type: 'audit', name, email, phone, business_name, message, company_website });
}
