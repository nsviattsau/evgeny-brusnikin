-- =============================================================
--  Memorial site — Supabase schema
--  Run once in Supabase: SQL Editor → New query → paste → Run.
--  Safe to re-run (idempotent where possible).
-- =============================================================

-- ---------- Tables ----------

create table if not exists public.memories (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  author_name  text check (char_length(author_name) <= 100),
  author_email text check (char_length(author_email) <= 200),
  message      text not null check (char_length(message) between 1 and 5000),
  photo_path   text check (photo_path is null or photo_path like 'pending/%'),
  status       text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists memories_status_created_idx
  on public.memories (status, created_at desc);

-- Users allowed to moderate. Add yourself after creating your user:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- ---------- Helper ----------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- Row Level Security ----------

alter table public.memories enable row level security;
alter table public.admins   enable row level security; -- no policies: not readable via the API

drop policy if exists "Read approved memories" on public.memories;
create policy "Read approved memories"
  on public.memories for select
  to anon, authenticated
  using (status = 'approved' or public.is_admin());

drop policy if exists "Anyone can submit a memory" on public.memories;
create policy "Anyone can submit a memory"
  on public.memories for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "Admins can moderate" on public.memories;
create policy "Admins can moderate"
  on public.memories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete" on public.memories;
create policy "Admins can delete"
  on public.memories for delete
  to authenticated
  using (public.is_admin());

-- ---------- Column privileges ----------
-- Visitors must never see author_email or choose the status themselves.

revoke all on public.memories from anon;
grant select (id, created_at, author_name, message, photo_path, status) on public.memories to anon;
grant insert (author_name, author_email, message, photo_path)           on public.memories to anon;

revoke all on public.memories from authenticated;
grant select, delete                                                     on public.memories to authenticated;
grant insert (author_name, author_email, message, photo_path)            on public.memories to authenticated;
grant update (status)                                                    on public.memories to authenticated;

-- ---------- Storage for photos ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memory-photos', 'memory-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload a memory photo" on storage.objects;
create policy "Anyone can upload a memory photo"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = 'pending'
  );

-- Deleting via the API also needs SELECT on the object row.
drop policy if exists "Admins can read memory photo rows" on storage.objects;
create policy "Admins can read memory photo rows"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'memory-photos' and public.is_admin());

drop policy if exists "Admins can delete memory photos" on storage.objects;
create policy "Admins can delete memory photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'memory-photos' and public.is_admin());
