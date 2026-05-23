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

create policy "Anyone can read browser chess games"
on public.browser_chess_games
for select
to anon
using (true);

create policy "Anyone can add browser chess games"
on public.browser_chess_games
for insert
to anon
with check (true);
