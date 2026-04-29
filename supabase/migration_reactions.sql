-- Run this in your Supabase SQL editor
-- Adds session tracking to reactions so each person can only react once per message

-- 1. Add session_id column
alter table public.reactions add column session_id text;

-- 2. Unique constraint: one reaction per session per message (only when session_id is set)
create unique index reactions_session_message_unique
  on public.reactions (message_id, session_id)
  where session_id is not null;

-- 3. Allow deleting reactions (needed for switching/removing)
create policy "Anyone can delete reactions" on public.reactions for delete using (true);

-- 4. Allow updating reactions (needed for switching emoji)
create policy "Anyone can update reactions" on public.reactions for update using (true);
