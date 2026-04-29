-- Run this in your Supabase SQL editor to set up the database

create table public.pages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  mode text not null default 'confess',
  created_at timestamp with time zone default now()
);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references public.pages(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default now()
);

create table public.replies (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Indexes for query performance
create index on public.messages(page_id);
create index on public.reactions(message_id);
create index on public.replies(message_id);

-- Enable Row Level Security (allow all reads and inserts, no updates/deletes)
alter table public.pages enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;
alter table public.replies enable row level security;

create policy "Anyone can read pages" on public.pages for select using (true);
create policy "Anyone can create pages" on public.pages for insert with check (true);

create policy "Anyone can read messages" on public.messages for select using (true);
create policy "Anyone can send messages" on public.messages for insert with check (true);

create policy "Anyone can read reactions" on public.reactions for select using (true);
create policy "Anyone can add reactions" on public.reactions for insert with check (true);

create policy "Anyone can read replies" on public.replies for select using (true);
create policy "Anyone can add replies" on public.replies for insert with check (true);
