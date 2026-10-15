import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const REDIRECT = 'https://truelinksolutions.com/hq/';

export default function Login({ notAuthorized }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        if (password.length < 10) throw new Error('Use at least 10 characters for your password');
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: REDIRECT } });
        if (error) throw error;
        if (!data.session) setSent('Check your inbox to confirm your email, then come back and sign in.');
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: REDIRECT, shouldCreateUser: false } });
        if (error) throw error;
        setSent('Check your inbox for a sign-in link.');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-xl px-3 py-2 mb-4"><img src="/logo.png" alt="Truelink Solutions" className="h-10 w-auto" /></div>
          <h1 className="text-2xl font-bold text-white">TrueLink HQ</h1>
          <p className="text-sm text-white/60 mt-1">Customers, leads and invoices in one place</p>
        </div>
        <div className="card p-6">
          {notAuthorized && (
            <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm p-3">
              {notAuthorized} isn't on the admin list. Sign in with an approved email.
              <button className="block mt-1 underline" onClick={() => supabase.auth.signOut()}>Sign out</button>
            </div>
          )}
          {sent ? (
            <div className="text-center">
              <p className="text-sm text-navy-700">{sent}</p>
              <button className="btn btn-ghost mt-4" onClick={() => { setSent(''); setMode('signin'); }}>Back to sign in</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="text-base font-semibold">
                {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create your admin account' : 'Email me a sign-in link'}
              </h2>
              <div><label className="label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
              {mode !== 'magic' && (
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                </div>
              )}
              <button className="btn btn-primary w-full h-10" disabled={busy}>
                {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send link'}
              </button>
              <div className="flex flex-col gap-1 text-xs text-center text-slate-500">
                {mode !== 'signin' && <button type="button" className="hover:text-navy-600" onClick={() => setMode('signin')}>I have a password, sign in</button>}
                {mode !== 'signup' && <button type="button" className="hover:text-navy-600" onClick={() => setMode('signup')}>First time here? Create your account</button>}
                {mode !== 'magic' && <button type="button" className="hover:text-navy-600" onClick={() => setMode('magic')}>Forgot password? Email me a link</button>}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
