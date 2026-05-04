-- ============================================================================
-- TaskChamp Supabase Schema
-- Idempotent — safe to re-run. Use Supabase SQL Editor (Database → SQL Editor → New query).
--
-- Naming note:
--   profiles.course   = degree program (e.g. 'BSCS', 'BSIT')
--   courses.code      = subject code     (e.g. 'CS101', 'MATH202')
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 2. Tables
--     (Created BEFORE is_admin() because that function references public.profiles
--      and `language sql` validates the body at CREATE time.)
-- ----------------------------------------------------------------------------

-- profiles: extends auth.users with app-specific fields
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  name            text not null,
  course          text,            -- degree program ('BSCS', 'BSIT', ...)
  education_level text,            -- '1st year', '2nd year', '3rd year', '4th year', 'Master''s', 'PhD'
  role            text not null default 'student' check (role in ('student','admin')),
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_profiles_role    on public.profiles(role);
create index if not exists idx_profiles_created on public.profiles(created_at desc);

-- programs: degree-program lookup (admin-managed; powers Register/Profile dropdowns)
create table if not exists public.programs (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- courses: subjects the student is enrolled in (per-user)
create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  code          text not null,
  name          text not null,
  professor     text,
  color         text,
  credits       numeric(4,2),
  current_grade numeric(5,2),
  target_grade  numeric(5,2),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_courses_user on public.courses(user_id);

-- tasks
create table if not exists public.tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  description       text,
  completed         boolean not null default false,
  status            text not null default 'to-do' check (status in ('to-do','in-progress','completed')),
  priority          text not null default 'medium' check (priority in ('low','medium','high')),
  category          text,
  due_date          timestamptz,
  is_academic       boolean not null default true,                -- Academic vs Personal toggle
  course_id         uuid references public.courses(id) on delete set null,
  task_type         text not null default 'other' check (task_type in ('assignment','exam','project','reading','study','other')),
  estimated_time    integer,
  actual_time       integer,
  difficulty        text check (difficulty in ('easy','medium','hard')),
  grade             numeric(5,2),
  weight            numeric(5,2),
  smart_priority    numeric(6,2),
  urgency_score     numeric(6,2),
  importance_score  numeric(6,2),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_tasks_user     on public.tasks(user_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_course   on public.tasks(course_id);

-- resources: files / links / notes attached to a task
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  type        text not null check (type in ('link','file','note','video','document')),
  title       text not null,
  url         text,
  description text,
  attached_at timestamptz not null default now()
);
create index if not exists idx_resources_task on public.resources(task_id);

-- calendar_events
create table if not exists public.calendar_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text,
  type         text not null check (type in ('class','exam','assignment','event','reminder')),
  start_date   date not null,
  end_date     date,
  start_time   time,
  end_time     time,
  location     text,
  color        text,
  recurring    text default 'none' check (recurring in ('none','daily','weekly','monthly')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_events_user on public.calendar_events(user_id);
create index if not exists idx_events_date on public.calendar_events(start_date);

-- study_sessions
create table if not exists public.study_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  task_id       uuid references public.tasks(id) on delete set null,
  start_time    timestamptz not null,
  end_time      timestamptz,
  duration      integer not null default 0,
  type          text not null default 'focus' check (type in ('focus','break','review')),
  productivity  text check (productivity in ('low','medium','high')),
  created_at    timestamptz not null default now()
);
create index if not exists idx_sessions_user on public.study_sessions(user_id);
create index if not exists idx_sessions_task on public.study_sessions(task_id);

-- ----------------------------------------------------------------------------
-- 3. Helper: is_admin() — used in RLS policies
--     SECURITY DEFINER so the function bypasses RLS when reading profiles
--     to determine the caller's role.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. Triggers
-- ----------------------------------------------------------------------------

-- 4a. Auto-create a profile row when a new auth.users row is inserted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, course, education_level, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'course',
    new.raw_user_meta_data->>'education_level',
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4b. Auto-update updated_at on UPDATE
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_events_updated on public.calendar_events;
create trigger trg_events_updated before update on public.calendar_events
  for each row execute function public.touch_updated_at();

-- 4c. Guard: prevent non-admins from escalating their role or changing their email
create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only admins can change user roles.';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Email cannot be changed here. Use the auth update flow.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profile_guard on public.profiles;
create trigger trg_profile_guard
  before update on public.profiles
  for each row execute function public.guard_profile_sensitive_fields();

-- ----------------------------------------------------------------------------
-- 5. Row-Level Security
-- ----------------------------------------------------------------------------

-- profiles
alter table public.profiles enable row level security;

drop policy if exists "profiles select" on public.profiles;
create policy "profiles select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles
  for insert with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
              with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles delete" on public.profiles;
create policy "profiles delete" on public.profiles
  for delete using (public.is_admin());

-- programs (anyone can read for the Register dropdown; only admin writes)
alter table public.programs enable row level security;

drop policy if exists "programs read" on public.programs;
create policy "programs read" on public.programs
  for select using (true);

drop policy if exists "programs write" on public.programs;
create policy "programs write" on public.programs
  for all using (public.is_admin()) with check (public.is_admin());

-- courses
alter table public.courses enable row level security;

drop policy if exists "courses select" on public.courses;
create policy "courses select" on public.courses
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "courses write" on public.courses;
create policy "courses write" on public.courses
  for all using (auth.uid() = user_id or public.is_admin())
          with check (auth.uid() = user_id or public.is_admin());

-- tasks
alter table public.tasks enable row level security;

drop policy if exists "tasks select" on public.tasks;
create policy "tasks select" on public.tasks
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "tasks write" on public.tasks;
create policy "tasks write" on public.tasks
  for all using (auth.uid() = user_id or public.is_admin())
          with check (auth.uid() = user_id or public.is_admin());

-- resources (ownership via parent task)
alter table public.resources enable row level security;

drop policy if exists "resources select" on public.resources;
create policy "resources select" on public.resources
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = resources.task_id
        and (t.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "resources write" on public.resources;
create policy "resources write" on public.resources
  for all using (
    exists (
      select 1 from public.tasks t
      where t.id = resources.task_id
        and (t.user_id = auth.uid() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      where t.id = resources.task_id
        and (t.user_id = auth.uid() or public.is_admin())
    )
  );

-- calendar_events
alter table public.calendar_events enable row level security;

drop policy if exists "events select" on public.calendar_events;
create policy "events select" on public.calendar_events
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "events write" on public.calendar_events;
create policy "events write" on public.calendar_events
  for all using (auth.uid() = user_id or public.is_admin())
          with check (auth.uid() = user_id or public.is_admin());

-- study_sessions
alter table public.study_sessions enable row level security;

drop policy if exists "sessions select" on public.study_sessions;
create policy "sessions select" on public.study_sessions
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "sessions write" on public.study_sessions;
create policy "sessions write" on public.study_sessions
  for all using (auth.uid() = user_id or public.is_admin())
          with check (auth.uid() = user_id or public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. Seed: default UCLM degree programs
-- ----------------------------------------------------------------------------
insert into public.programs (code, name) values
  ('BSCS',          'Bachelor of Science in Computer Science'),
  ('BSIT',          'Bachelor of Science in Information Technology'),
  ('BSCpE',         'Bachelor of Science in Computer Engineering'),
  ('BSBA',          'Bachelor of Science in Business Administration'),
  ('BSN',           'Bachelor of Science in Nursing'),
  ('BSED',          'Bachelor of Secondary Education'),
  ('BSPSY',         'Bachelor of Science in Psychology'),
  ('BSHRM',         'Bachelor of Science in Hotel and Restaurant Management'),
  ('BSTM',          'Bachelor of Science in Tourism Management'),
  ('BSAccountancy', 'Bachelor of Science in Accountancy'),
  ('BSCriminology', 'Bachelor of Science in Criminology')
on conflict (code) do nothing;

-- ============================================================================
-- DONE.
--
-- Bootstrap your first admin (after running this and registering once via the
-- app with the admin email):
--
--   update public.profiles set role = 'admin' where email = 'admin@uclm.edu.ph';
--
-- For dev: in Supabase Dashboard → Authentication → Providers → Email,
-- consider toggling "Confirm email" OFF so signup doesn't require an inbox.
-- ============================================================================
