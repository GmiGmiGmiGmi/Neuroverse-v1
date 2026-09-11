-- Neuroverse v5 Supabase schema
-- Run in a NEW Supabase project when you are ready to switch from local JSON.
create extension if not exists pgcrypto;

do $$ begin
  create type public.content_status as enum ('draft','review','published','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.app_role as enum ('admin','editor','contributor','viewer');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',new.email)) on conflict do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.my_role() returns public.app_role language sql stable security definer set search_path=public as $$
  select coalesce((select role from public.profiles where id=auth.uid()), 'viewer'::public.app_role)
$$;
create or replace function public.can_write() returns boolean language sql stable as $$ select public.my_role() in ('admin','editor','contributor') $$;
create or replace function public.can_publish() returns boolean language sql stable as $$ select public.my_role() in ('admin','editor') $$;
create or replace function public.is_admin() returns boolean language sql stable as $$ select public.my_role()='admin' $$;

create table if not exists public.products (
  id text primary key, name text not null, description text default '', route text not null, image_url text default '',
  status public.content_status not null default 'draft', sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.guides (
  id text primary key, route text unique not null, product text not null, title text not null, kind text default 'Guide', summary text default '',
  content jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'draft', sort_order int not null default 0,
  created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz
);
create table if not exists public.faqs (
  id text primary key, product text not null, category text not null, question text not null, answer text not null,
  related_route text default '', keywords text[] not null default '{}',
  status public.content_status not null default 'draft', sort_order int not null default 0,
  created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz
);
create table if not exists public.resources (
  id text primary key, title text not null, product text not null, type text not null, href text not null, description text default '',
  status public.content_status not null default 'draft', sort_order int not null default 0,
  created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz
);
create table if not exists public.academy_lessons (
  id text primary key, course text not null, lesson_number int not null default 0, title text not null,
  duration_label text default '5 min', summary text default '', body jsonb not null default '[]'::jsonb,
  video_provider text not null default 'none', video_url text default '', thumbnail_url text default '',
  status public.content_status not null default 'draft', sort_order int not null default 0,
  created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz
);
create table if not exists public.content_relations (
  id uuid primary key default gen_random_uuid(), from_type text not null, from_id text not null, to_type text not null, to_id text not null,
  relation_type text not null default 'related', sort_order int not null default 0,
  unique(from_type,from_id,to_type,to_id,relation_type)
);

-- Generic updated_at trigger
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['profiles','products','guides','faqs','resources','academy_lessons'] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I',t,t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t);
  end loop;
end $$;

-- RLS
alter table public.profiles enable row level security;
create policy "profile read own or admin" on public.profiles for select using (id=auth.uid() or public.is_admin());
-- No client-side role update policy: promote users in SQL or a future secure server function.

-- Public content policies: public can read published; authenticated content staff can read drafts.
do $$ declare t text; begin
  foreach t in array array['products','guides','faqs','resources','academy_lessons'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists "public published %s" on public.%I',t,t);
    execute format('create policy "public published %s" on public.%I for select using (status=''published'' or public.can_write())',t,t);
    execute format('drop policy if exists "staff insert %s" on public.%I',t,t);
    execute format('create policy "staff insert %s" on public.%I for insert with check (public.can_write() and (public.my_role()<>''contributor'' or status=''draft''))',t,t);
    execute format('drop policy if exists "staff update %s" on public.%I',t,t);
    execute format('create policy "staff update %s" on public.%I for update using (public.can_write()) with check (public.can_publish() or (public.my_role()=''contributor'' and status=''draft''))',t,t);
    execute format('drop policy if exists "editor delete %s" on public.%I',t,t);
    execute format('create policy "editor delete %s" on public.%I for delete using (public.can_publish())',t,t);
  end loop;
end $$;

alter table public.content_relations enable row level security;
create policy "relations public read" on public.content_relations for select using (true);
create policy "relations staff write" on public.content_relations for all using (public.can_write()) with check (public.can_write());

-- Storage buckets. Support media is public for easy static delivery. Academy can later move to AWS/CloudFront.
insert into storage.buckets(id,name,public) values ('support-media','support-media',true) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values ('academy-media','academy-media',true) on conflict(id) do nothing;
create policy "public read support media" on storage.objects for select using (bucket_id in ('support-media','academy-media'));
create policy "staff upload media" on storage.objects for insert with check (bucket_id in ('support-media','academy-media') and public.can_write());
create policy "editor update media" on storage.objects for update using (bucket_id in ('support-media','academy-media') and public.can_publish());
create policy "editor delete media" on storage.objects for delete using (bucket_id in ('support-media','academy-media') and public.can_publish());
