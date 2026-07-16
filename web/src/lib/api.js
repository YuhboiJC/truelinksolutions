// In dev, Vite proxies /api to a local PHP server (see vite.config.js `server.proxy`
// if you add one) or you run `php -S localhost:8000 -t api` separately.
// In production this is served from the same domain, so a relative path is enough.
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function signup({ name, email }) {
  const res = await fetch(`${API_BASE}/signup.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // fall through to the generic error below
  }

  if (!res.ok || !data?.ok) {
    const message = data?.error || 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return data;
}
