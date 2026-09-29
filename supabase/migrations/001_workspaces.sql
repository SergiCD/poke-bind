-- Run once in the Supabase SQL editor. No service-role key belongs in the web app.
begin;

create table public.workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint valid_workspace check (coalesce((
    jsonb_typeof(payload) = 'object'
    and payload->>'version' = '1'
    and jsonb_typeof(payload->'binders') = 'array'
    and jsonb_typeof(payload->'owned') = 'array'
    and jsonb_typeof(payload->'wishlist') = 'array'
    and jsonb_array_length(payload->'binders') <= 30
    and octet_length(payload::text) < 8000000
  ), false))
);
alter table public.workspaces enable row level security;
create policy "Read own workspace" on public.workspaces for select to authenticated using ((select auth.uid()) = user_id);
-- Writes go through one atomic function so callers cannot bypass revision checks.
revoke all on public.workspaces from anon, authenticated;
grant select on public.workspaces to authenticated;

create function public.save_workspace(expected_revision integer, new_payload jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  next_revision integer;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if expected_revision = 0 then
    insert into public.workspaces (user_id, payload) values (owner_id, new_payload)
      on conflict (user_id) do nothing returning revision into next_revision;
  else
    update public.workspaces set payload = new_payload, revision = revision + 1, updated_at = now()
      where user_id = owner_id and revision = expected_revision
      returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'Workspace revision conflict' using errcode = '40001'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_workspace(integer, jsonb) from public, anon;
grant execute on function public.save_workspace(integer, jsonb) to authenticated;

commit;
