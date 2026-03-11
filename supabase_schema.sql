-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Cards Table
create table public.cards (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null,
    english text not null,
    translation text,
    example text,
    notes text,
    tags text[] default '{}',
    difficulty integer default 3,
    created_at bigint not null,
    next_review bigint not null,
    ease_factor double precision default 2.5,
    interval integer default 0,
    repetitions integer default 0
);

-- 2. Stats Table
create table public.stats (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    date text not null,
    new_cards integer default 0,
    reviews integer default 0,
    extra_reviews integer default 0,
    correct integer default 0,
    wrong integer default 0,
    streak_active boolean default false,
    unique(user_id, date)
);

-- 3. Settings Table
create table public.settings (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    key text not null,
    value jsonb not null,
    unique(user_id, key)
);

-- Enable Row Level Security (RLS)
alter table public.cards enable row level security;
alter table public.stats enable row level security;
alter table public.settings enable row level security;

-- Create Policies so users can only view/edit their own data
create policy "Users can see their own cards" on public.cards for select using (auth.uid() = user_id);
create policy "Users can insert their own cards" on public.cards for insert with check (auth.uid() = user_id);
create policy "Users can update their own cards" on public.cards for update using (auth.uid() = user_id);
create policy "Users can delete their own cards" on public.cards for delete using (auth.uid() = user_id);

create policy "Users can see their own stats" on public.stats for select using (auth.uid() = user_id);
create policy "Users can insert their own stats" on public.stats for insert with check (auth.uid() = user_id);
create policy "Users can update their own stats" on public.stats for update using (auth.uid() = user_id);

create policy "Users can see their own settings" on public.settings for select using (auth.uid() = user_id);
create policy "Users can insert their own settings" on public.settings for insert with check (auth.uid() = user_id);
create policy "Users can update their own settings" on public.settings for update using (auth.uid() = user_id);
create policy "Users can delete their own settings" on public.settings for delete using (auth.uid() = user_id);
