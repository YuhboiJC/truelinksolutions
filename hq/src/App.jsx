import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { Spinner } from '@/components/ui';
import Login from '@/pages/Login';
import Overview from '@/pages/Overview';
import Pipeline from '@/pages/Pipeline';
import Contacts from '@/pages/Contacts';
import ContactDetail from '@/pages/ContactDetail';
import Invoices from '@/pages/Invoices';
import Settings from '@/pages/Settings';
import Newsletter from '@/pages/Newsletter';
import Services from '@/pages/Services';
import Testimonials from '@/pages/Testimonials';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  let content;
  if (session === undefined || (session && isAdmin === null)) content = <div className="pt-24"><Spinner /></div>;
  else if (!session || !isAdmin) content = <Login notAuthorized={session && !isAdmin ? session.user.email : null} />;
  else {
    content = (
      <HashRouter>
        <Routes>
          <Route element={<Layout email={session.user.email} />}>
            <Route index element={<Overview />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="services" element={<Services />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="newsletter" element={<Newsletter />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    );
  }
  return (
    <>
      {content}
      <Toaster position="top-right" richColors />
    </>
  );
}
