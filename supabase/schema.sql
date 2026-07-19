create extension if not exists "pgcrypto";

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  date text not null,
  status text not null default 'scheduled',
  locked_rounds jsonb not null default '{}'::jsonb
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  group_letter text not null
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round text not null,
  game_number integer not null,
  player1_id uuid references players(id) on delete cascade,
  player2_id uuid references players(id) on delete cascade,
  player1_score integer,
  player2_score integer,
  winner_id uuid references players(id) on delete cascade,
  status text not null default 'pending',
  best_of integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_groups_tournament_id on groups(tournament_id);
create index if not exists idx_players_group_id on players(group_id);
create index if not exists idx_matches_tournament_id on matches(tournament_id);
create index if not exists idx_matches_round on matches(round);
