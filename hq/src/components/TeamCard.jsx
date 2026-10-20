import { useCallback, useEffect, useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { date } from '@/lib/format';

/** Settings → Team access: who can sign in to TrueLink HQ. */
export default function TeamCard() {
  const [admins, setAdmins] = useState([]);
  const [me, setMe] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('admins').select('email,created_at').order('created_at');
    setAdmins(data ?? []);
  }, []);
  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.email?.toLowerCase() ?? ''));
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return toast.error('Enter a valid email');
    setSaving(true);
    const { error } = await supabase.from('admins').insert({ email: v });
    setSaving(false);
    if (error) return toast.error(error.code === '23505' ? 'They already have access' : error.message);
    setEmail('');
    toast.success(`${v} can now sign in. The first time, they go to truelinksolutions.com/hq and choose "First time here? Create your account".`);
    load();
  };

  const remove = async (a) => {
    if (!window.confirm(`Remove HQ access for ${a.email}?`)) return;
    const { error } = await supabase.from('admins').delete().eq('email', a.email);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <section className="card p-5">
      <h2 className="font-semibold">Team access</h2>
      <p className="text-sm text-slate-500 mt-0.5">People who can sign in to TrueLink HQ and manage everything here.</p>
      <ul className="divide-y divide-slate-100 mt-3">
        {admins.map((a) => (
          <li key={a.email} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span className="min-w-0">
              <span className="block text-navy-900 truncate">{a.email}{a.email.toLowerCase() === me && <span className="text-slate-400"> (you)</span>}</span>
              <span className="block text-xs text-slate-400">Added {date(a.created_at)}</span>
            </span>
            {a.email.toLowerCase() !== me && (
              <button className="btn btn-ghost h-8 px-2 text-red-600" onClick={() => remove(a)} aria-label={`Remove ${a.email}`}><Trash2 className="w-4 h-4" /></button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2 mt-3">
        <input className="input" type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn-navy shrink-0" disabled={saving || !email.trim()}><UserPlus className="w-4 h-4" />Add</button>
      </form>
      <p className="text-xs text-slate-500 mt-2">
        To sign in: go to <b>truelinksolutions.com/hq</b>, choose <b>First time here? Create your account</b> with the email above (first time only), confirm the email, then sign in.
        Forgot the password? Use <b>Email me a link</b>.
      </p>
    </section>
  );
}
