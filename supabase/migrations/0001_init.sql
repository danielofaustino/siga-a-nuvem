-- ============================================================
-- Siga a Nuvem - schema inicial
-- Regional 78 - AD Madureira
-- ============================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------
-- Igrejas da regional
-- ----------------------------------------
create table if not exists public.churches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  address     text,
  color       text default '#3b65ff',  -- cor de destaque no calendário
  created_at  timestamptz not null default now()
);

-- ----------------------------------------
-- Eventos (espelho do Google Calendar)
-- ----------------------------------------
create table if not exists public.events (
  id                       uuid primary key default gen_random_uuid(),
  google_event_id          text unique,                 -- id no Google Calendar
  title                    text not null,
  description              text,
  location                 text,
  church_id                uuid references public.churches(id) on delete set null,
  start_at                 timestamptz not null,
  end_at                   timestamptz not null,
  all_day                  boolean not null default false,
  image_url                text,
  capacity                 integer,                      -- opcional: limite de vagas
  is_published             boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists events_start_at_idx on public.events(start_at);
create index if not exists events_church_id_idx on public.events(church_id);

-- ----------------------------------------
-- Confirmações de presença
-- ----------------------------------------
create table if not exists public.attendances (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  whatsapp    text,
  instagram   text,
  church_id   uuid references public.churches(id) on delete set null,
  created_at  timestamptz not null default now(),
  -- evita duplicatas exatas mas permite a mesma pessoa em eventos diferentes
  unique (event_id, whatsapp)
);

create index if not exists attendances_event_id_idx on public.attendances(event_id);

-- ----------------------------------------
-- Credenciais do Google (refresh token do admin)
-- Tabela com 1 linha só (singleton). RLS bloqueia tudo p/ público.
-- ----------------------------------------
create table if not exists public.google_credentials (
  id             integer primary key default 1,
  refresh_token  text not null,
  calendar_id    text not null default 'primary',
  connected_email text,
  updated_at     timestamptz not null default now(),
  constraint singleton check (id = 1)
);

-- ----------------------------------------
-- Trigger updated_at em events
-- ----------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.churches            enable row level security;
alter table public.events              enable row level security;
alter table public.attendances         enable row level security;
alter table public.google_credentials  enable row level security;

-- Público lê igrejas
drop policy if exists "churches_public_read" on public.churches;
create policy "churches_public_read"
  on public.churches for select using (true);

-- Admin (qualquer usuário autenticado) edita igrejas
drop policy if exists "churches_admin_write" on public.churches;
create policy "churches_admin_write"
  on public.churches for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Público lê eventos publicados
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read"
  on public.events for select using (is_published = true);

-- Admin lê/escreve tudo
drop policy if exists "events_admin_all" on public.events;
create policy "events_admin_all"
  on public.events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Qualquer um pode confirmar presença (insert)
drop policy if exists "attendances_public_insert" on public.attendances;
create policy "attendances_public_insert"
  on public.attendances for insert with check (true);

-- Público vê só a contagem (não os nomes): habilitamos SELECT mas a app
-- usa uma view agregada para o público. Admin lê detalhes pelo service role.
drop policy if exists "attendances_admin_read" on public.attendances;
create policy "attendances_admin_read"
  on public.attendances for select using (auth.role() = 'authenticated');

drop policy if exists "attendances_admin_delete" on public.attendances;
create policy "attendances_admin_delete"
  on public.attendances for delete using (auth.role() = 'authenticated');

-- google_credentials: NENHUMA policy pública. Acessado só via service_role no servidor.
-- (RLS habilitada e sem policies = ninguém via anon/authed key)

-- ============================================================
-- View pública para contagem de RSVPs
-- ============================================================
create or replace view public.event_attendance_counts as
  select event_id, count(*)::int as total
  from public.attendances
  group by event_id;

grant select on public.event_attendance_counts to anon, authenticated;

-- ============================================================
-- Seed das 3 igrejas (edite depois pelo painel admin)
-- ============================================================
insert into public.churches (name, slug, address, color) values
  ('AD Madureira - Sede',     'sede',     'Endereço da sede',        '#1f3ef5'),
  ('AD Madureira - Congregação 1', 'cong-1', 'Endereço da congregação 1', '#16a34a'),
  ('AD Madureira - Congregação 2', 'cong-2', 'Endereço da congregação 2', '#dc2626')
on conflict (slug) do nothing;
