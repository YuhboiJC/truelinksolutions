import { NavLink, Outlet } from 'react-router-dom';
import { Columns3, FileText, LayoutDashboard, LogOut, Newspaper, Quote, Server, Settings, Users } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/pipeline', label: 'Pipeline', icon: Columns3 },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/services', label: 'Services', icon: Server },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/newsletter', label: 'Newsletter', icon: Newspaper },
  { to: '/testimonials', label: 'Testimonials', icon: Quote },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ email }) {
  const link = ({ isActive }) =>
    clsx(
      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white hover:bg-white/5',
    );
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex md:w-60 shrink-0 flex-col bg-navy-900 text-white sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="bg-white rounded-lg p-1"><img src="/logo.png" alt="" className="h-7 w-auto" /></div>
          <div>
            <p className="font-heading font-bold leading-tight">TrueLink HQ</p>
            <p className="text-[11px] text-white/50">Customers · Services · Invoices</p>
          </div>
        </div>
        <nav className="px-3 space-y-1 flex-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={link}><Icon className="w-4 h-4" />{label}</NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/50 truncate mb-2">{email}</p>
          <button className="flex items-center gap-2 text-sm text-white/70 hover:text-white" onClick={() => supabase.auth.signOut()}>
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-40 bg-navy-900 text-white">
        <div className="flex items-center justify-between px-4 h-14">
          <p className="font-heading font-bold">TrueLink HQ</p>
          <button className="text-white/70" onClick={() => supabase.auth.signOut()} aria-label="Sign out"><LogOut className="w-4 h-4" /></button>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={(s) => clsx(link(s), 'shrink-0 py-1.5')}><Icon className="w-4 h-4" />{label}</NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 md:py-10 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
