-- Automatic learning sync documents. Run once after the backup migration.
-- Everything commits together; RLS is enabled before API access is granted.
begin;
create table public.learning_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ?& array['schemaVersion', 'clock', 'progress', 'bookmarks']
    and payload->'schemaVersion' = '1'::jsonb
    and jsonb_typeof(payload->'clock') = 'number'
    and payload->>'clock' ~ '^[0-9]{1,16}$'
    and (payload->>'clock')::numeric <= 9007199254740991
    and jsonb_typeof(payload->'progress') = 'object'
    and jsonb_typeof(payload->'bookmarks') = 'object'
    and octet_length(payload::text) <= 1048576
  ),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.learning_sync enable row level security;
revoke all on public.learning_sync from public, anon, authenticated;
grant select on public.learning_sync to authenticated;
create policy own_sync_select on public.learning_sync for select to authenticated
  using ((select auth.uid()) = user_id);

-- Only this function can write. It derives ownership from the JWT, and compares
-- revisions atomically so two devices cannot silently overwrite each other.
create function public.save_learning_sync(p_payload jsonb, p_expected_revision bigint, p_user_id uuid)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  affected integer;
begin
  if owner_id is null or owner_id is distinct from p_user_id then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Invalid revision' using errcode = '22023';
  end if;
  if p_expected_revision = 0 then
    return query insert into public.learning_sync (user_id, payload)
      values (owner_id, p_payload) on conflict (user_id) do nothing
      returning learning_sync.revision, learning_sync.updated_at;
  else
    return query update public.learning_sync b
      set payload = p_payload, revision = b.revision + 1, updated_at = now()
      where b.user_id = owner_id and b.revision = p_expected_revision
      returning b.revision, b.updated_at;
  end if;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'Sync document changed on another device; retry.' using errcode = '40001';
  end if;
end;
$$;
revoke all on function public.save_learning_sync(jsonb,bigint,uuid) from public, anon, authenticated;
grant execute on function public.save_learning_sync(jsonb,bigint,uuid) to authenticated;
commit;
