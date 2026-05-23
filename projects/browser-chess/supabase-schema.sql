create table if not exists public.browser_chess_games (
    id uuid primary key default gen_random_uuid(),
    player text not null check (player in ('Mum', 'David', 'Anonymous')),
    result text not null check (result in ('win', 'loss', 'draw')),
    pgn text not null,
    opponent text,
    game_mode text,
    ai_difficulty text,
    half_moves integer not null default 0,
    created_at timestamptz not null default now()
);

alter table public.browser_chess_games enable row level security;

drop policy if exists "Anyone can read browser chess games" on public.browser_chess_games;
create policy "Anyone can read browser chess games"
on public.browser_chess_games
for select
to anon
using (true);

drop policy if exists "Anyone can add browser chess games" on public.browser_chess_games;
create policy "Anyone can add browser chess games"
on public.browser_chess_games
for insert
to anon
with check (true);

create table if not exists public.browser_chess_live_games (
    code text primary key check (code ~ '^[A-Z0-9]{4,6}$'),
    white_player text not null check (white_player in ('Mum', 'David')),
    black_player text not null check (black_player in ('Mum', 'David') and black_player <> white_player),
    white_ready boolean not null default false,
    black_ready boolean not null default false,
    fen text not null,
    pgn text not null default '',
    move_count integer not null default 0,
    status text not null default 'active' check (status in ('active', 'finished')),
    result text check (result in ('win', 'draw')),
    winner_player text check (winner_player in ('Mum', 'David')),
    last_move jsonb,
    archive_saved boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.browser_chess_live_games enable row level security;

drop policy if exists "Anyone can read browser chess live games" on public.browser_chess_live_games;
create policy "Anyone can read browser chess live games"
on public.browser_chess_live_games
for select
to anon
using (true);

drop policy if exists "Anyone can create browser chess live games" on public.browser_chess_live_games;
create policy "Anyone can create browser chess live games"
on public.browser_chess_live_games
for insert
to anon
with check (true);

drop policy if exists "Anyone can update browser chess live games" on public.browser_chess_live_games;
create policy "Anyone can update browser chess live games"
on public.browser_chess_live_games
for update
to anon
using (true)
with check (true);
