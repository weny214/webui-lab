-- Run once in Supabase SQL Editor. If courses exists, inspect it first.
begin;
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  color text not null default '#8D7B68' check (color ~ '^#[0-9a-fA-F]{6}$'),
  teacher text not null default '' check (char_length(teacher) <= 100),
  classroom text not null default '' check (char_length(classroom) <= 100),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index courses_user_id_idx on public.courses(user_id);
alter table public.courses enable row level security;
revoke all on public.courses from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.courses to authenticated;
grant insert (user_id, name, color, teacher, classroom) on public.courses to authenticated;
grant update (name, color, teacher, classroom, deleted_at) on public.courses to authenticated;
create policy courses_select_own on public.courses for select to authenticated
  using ((select auth.uid()) = user_id);
create policy courses_insert_own on public.courses for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy courses_update_own on public.courses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- No DELETE grant/policy: deletion is an update of deleted_at.
commit;
