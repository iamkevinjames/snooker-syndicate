-- Current Supabase RLS policies still allow public read/write on these tables.
-- Keep reads open for public tournament viewing, but tighten INSERT/UPDATE/DELETE now that auth exists.

alter table public.tournaments enable row level security;
alter table public.groups enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_games enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select pol.polname as policy_name, rel.relname as table_name
    from pg_policy pol
    join pg_class rel on rel.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname in (
        'tournaments',
        'groups',
        'players',
        'matches',
        'match_games'
      )
  loop
    execute format('drop policy if exists %I on public.%I', policy_row.policy_name, policy_row.table_name);
  end loop;
end $$;

create policy "tournaments_public_select"
  on public.tournaments
  for select
  using (true);

create policy "tournaments_authenticated_write"
  on public.tournaments
  for all
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "groups_public_select"
  on public.groups
  for select
  using (true);

create policy "groups_authenticated_write"
  on public.groups
  for all
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "players_public_select"
  on public.players
  for select
  using (true);

create policy "players_authenticated_write"
  on public.players
  for all
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "matches_public_select"
  on public.matches
  for select
  using (true);

create policy "matches_authenticated_write"
  on public.matches
  for all
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "match_games_public_select"
  on public.match_games
  for select
  using (true);

create policy "match_games_authenticated_write"
  on public.match_games
  for all
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');