-- Private editorial inbox. Guest/account clients can submit, never read or edit reports.
begin;
create table public.content_reports (
  report_id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  client_id text not null,
  received_at timestamptz not null default now(),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 16384),
  status text not null default 'new' check (status in ('new','reviewed','fixed','dismissed')),
  editorial_note text not null default '' check (char_length(editorial_note) <= 4000)
);
create index content_reports_received_idx on public.content_reports (received_at desc);
create index content_reports_user_idx on public.content_reports (user_id, received_at desc);
create index content_reports_client_idx on public.content_reports (client_id, received_at desc) where user_id is null;
alter table public.content_reports enable row level security;
revoke all on public.content_reports from public, anon, authenticated;
grant select, update on public.content_reports to service_role;

create function public.submit_content_report(p_report jsonb, p_user_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  t jsonb;
  old_report public.content_reports%rowtype;
  recent_count integer;
begin
  if owner_id is distinct from p_user_id then
    raise exception 'Account changed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_report) is distinct from 'object' or octet_length(p_report::text) > 16384 then
    raise exception 'Invalid report' using errcode = '22023';
  end if;
  if not (p_report ?& array['id','clientId','createdAt','target','reason','note'])
    or (select count(*) from jsonb_object_keys(p_report)) <> 6
    or jsonb_typeof(p_report->'id') is distinct from 'string' or (p_report->>'id') !~ '^[a-zA-Z0-9_-]{1,100}$'
    or jsonb_typeof(p_report->'clientId') is distinct from 'string' or (p_report->>'clientId') !~ '^[a-zA-Z0-9_-]{1,100}$'
    or jsonb_typeof(p_report->'createdAt') is distinct from 'number' or (p_report->>'createdAt') !~ '^[0-9]{12,13}$'
    or jsonb_typeof(p_report->'reason') is distinct from 'string' or (p_report->>'reason') not in ('incorrect','unclear','image','other')
    or jsonb_typeof(p_report->'note') is distinct from 'string' or char_length(p_report->>'note') > 2000
    or ((p_report->>'reason') = 'other' and btrim(p_report->>'note') = '')
    or jsonb_typeof(p_report->'target') is distinct from 'object' then
    raise exception 'Invalid report fields' using errcode = '22023';
  end if;
  if (p_report->>'createdAt')::numeric < 946684800000 or (p_report->>'createdAt')::numeric > 4102444800000 then
    raise exception 'Invalid client date' using errcode = '22023';
  end if;
  t := p_report->'target';
  if not (t ?& array['kind','itemId','title','questionIndex','questionText','contentKey'])
    or (select count(*) from jsonb_object_keys(t)) <> 6
    or jsonb_typeof(t->'kind') is distinct from 'string' or (t->>'kind') not in ('lesson','daily')
    or jsonb_typeof(t->'itemId') is distinct from 'string' or (t->>'itemId') !~ '^[a-zA-Z0-9_-]{1,100}$'
    or jsonb_typeof(t->'contentKey') is distinct from 'string' or (t->>'contentKey') !~ '^[a-zA-Z0-9_-]{1,100}$'
    or jsonb_typeof(t->'title') is distinct from 'string' or char_length(t->>'title') > 300 or btrim(t->>'title') = ''
    or jsonb_typeof(t->'questionIndex') not in ('number','null')
    or jsonb_typeof(t->'questionText') not in ('string','null') then
    raise exception 'Invalid report target' using errcode = '22023';
  end if;
  if jsonb_typeof(t->'questionIndex') = 'number' and (t->>'questionIndex') !~ '^[0-9]{1,2}$' then
    raise exception 'Invalid question index' using errcode = '22023';
  end if;
  if jsonb_typeof(t->'questionText') = 'string' and (char_length(t->>'questionText') > 2000 or btrim(t->>'questionText') = '') then
    raise exception 'Invalid question text' using errcode = '22023';
  end if;
  if (jsonb_typeof(t->'questionIndex') = 'number' and jsonb_typeof(t->'questionText') = 'null')
    or ((t->>'kind') = 'daily' and (jsonb_typeof(t->'questionIndex') <> 'null' or jsonb_typeof(t->'questionText') <> 'string')) then
    raise exception 'Invalid question context' using errcode = '22023';
  end if;
  -- Serialize submissions for one account/client before the rate/idempotency check.
  perform pg_advisory_xact_lock(hashtextextended(coalesce(owner_id::text, p_report->>'clientId'), 0));
  select * into old_report from public.content_reports where report_id = p_report->>'id';
  if found then
    if old_report.user_id is distinct from owner_id or old_report.payload is distinct from p_report then
      raise exception 'Report ID already used' using errcode = '22023';
    end if;
    return true;
  end if;
  select count(*) into recent_count from public.content_reports r
    where r.received_at >= now() - interval '1 hour'
      and ((owner_id is not null and r.user_id = owner_id)
        or (owner_id is null and r.user_id is null and r.client_id = p_report->>'clientId'));
  if recent_count >= 20 then raise exception 'Report limit reached; retry later' using errcode = 'P0001'; end if;
  insert into public.content_reports(report_id,user_id,client_id,payload)
    values (p_report->>'id',owner_id,p_report->>'clientId',p_report);
  return true;
end;
$$;
revoke all on function public.submit_content_report(jsonb,uuid) from public, anon, authenticated;
grant execute on function public.submit_content_report(jsonb,uuid) to anon, authenticated;
commit;
