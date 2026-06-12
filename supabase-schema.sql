-- ============================================================
--  Vereda — esquema do banco (Supabase)
--  Cole TODO este conteúdo em: Supabase → seu projeto → SQL Editor → New query → Run
--  Cria uma tabela com UMA linha por usuário (o estado do app em JSON),
--  protegida por Row Level Security: cada pessoa só acessa os próprios dados.
-- ============================================================

create table if not exists public.vereda_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.vereda_data enable row level security;

-- Cada usuário só lê/escreve a própria linha
drop policy if exists "vereda own select" on public.vereda_data;
create policy "vereda own select" on public.vereda_data
  for select using (auth.uid() = user_id);

drop policy if exists "vereda own insert" on public.vereda_data;
create policy "vereda own insert" on public.vereda_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "vereda own update" on public.vereda_data;
create policy "vereda own update" on public.vereda_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
--  Assinaturas de push (notificações) — uma por aparelho
-- ============================================================
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  tz         text,
  created_at timestamptz not null default now()
);

alter table public.push_subs enable row level security;

drop policy if exists "push own select" on public.push_subs;
create policy "push own select" on public.push_subs for select using (auth.uid() = user_id);
drop policy if exists "push own insert" on public.push_subs;
create policy "push own insert" on public.push_subs for insert with check (auth.uid() = user_id);
drop policy if exists "push own update" on public.push_subs;
create policy "push own update" on public.push_subs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "push own delete" on public.push_subs;
create policy "push own delete" on public.push_subs for delete using (auth.uid() = user_id);
