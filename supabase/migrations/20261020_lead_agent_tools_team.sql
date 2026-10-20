-- Applied 2026-10-20 (already live). Kept here for reference.
alter table public.contacts alter column email drop not null;
alter table public.contacts drop constraint if exists contacts_source_check;
alter table public.contacts add constraint contacts_source_check
  check (source = any (array['newsletter','audit','manual','referral','outreach','ai_agent','other']));
alter table public.contacts add column if not exists audience text check (audience in ('business','church'));
alter table public.contacts add column if not exists city text;

create table if not exists public.lead_jobs (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('business','church')),
  requested int not null check (requested between 1 and 25),
  area text not null default 'Southwest Florida',
  niche text, needs text[] not null default '{}', outreach text[] not null default '{}', notes text,
  status text not null default 'queued' check (status in ('queued','finding','researching','done','failed')),
  found int not null default 0, error text, created_by text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.lead_research (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.lead_jobs(id) on delete set null,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','researching','done','failed')),
  report jsonb, error text, attempts int not null default 0, started_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.lead_jobs enable row level security;
alter table public.lead_research enable row level security;
create policy "admins manage lead jobs" on public.lead_jobs for all to authenticated using (is_admin()) with check (is_admin());
create policy "admins manage lead research" on public.lead_research for all to authenticated using (is_admin()) with check (is_admin());

alter table public.services add column if not exists payment_method text;
alter table public.services add column if not exists payment_connected boolean not null default false;
alter table public.services add column if not exists last_paid_on date;
alter table public.services add column if not exists login_email text;
alter table public.services add column if not exists who_can_access text;

create policy "admins add admins" on public.admins for insert to authenticated with check (is_admin());
create policy "admins remove admins" on public.admins for delete to authenticated using (is_admin());

-- pg_cron: select cron.schedule('truelink-lead-agent', '* * * * *', ...) calls lead-agent/tick while work is pending.
