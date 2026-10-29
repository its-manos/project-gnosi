-- Run once on the new project-gnosi project. Atomic: any failure rolls back.
begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- IDs reference the app's versioned local catalogue until content moves online.
create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) between 1 and 120),
  completed boolean not null default false,
  checkpoint_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(checkpoint_answers) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- Tombstones prevent a removed bookmark being restored by an older device.
create table public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) between 1 and 120),
  is_saved boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.challenge_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  topic_ids text[] not null default array['history','science','geography','nature','culture'],
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  updated_at timestamptz not null default now(),
  check (cardinality(topic_ids) between 1 and 8),
  check (array_position(topic_ids, null) is null),
  check (topic_ids <@ array['history','science','geography','nature','culture','technology','sports','everyday']::text[])
);

-- Personal learning history, NOT trusted competitive scores.
-- First completed daily result wins; no client update/delete grants.
create table public.daily_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null,
  question_ids text[] not null check (cardinality(question_ids) = 7),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  correct_count integer not null check (correct_count between 0 and 7),
  score integer generated always as (correct_count * 100) stored,
  created_at timestamptz not null default now(),
  primary key (user_id, challenge_date)
);

create function public.gnosi_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- RLS is explicit on every exposed table. auth.uid() is NULL for guests.
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','lesson_progress','bookmarks','challenge_preferences','daily_results'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select, insert on public.%I to authenticated', table_name);
    execute format('create policy own_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name);
    execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name);
    if table_name <> 'daily_results' then
      execute format('grant update on public.%I to authenticated', table_name);
      execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
      execute format('create trigger touch_updated_at before insert or update on public.%I for each row execute function public.gnosi_touch_updated_at()', table_name);
    end if;
  end loop;
end;
$$;
revoke all on function public.gnosi_touch_updated_at() from public;
commit;
