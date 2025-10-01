-- Create contacts table
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  name text not null,
  company text not null,
  phone text not null,
  email text not null,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.contacts enable row level security;

-- Create policies for public access (no auth required for this app)
create policy "Allow anyone to view contacts"
  on public.contacts for select
  using (true);

create policy "Allow anyone to insert contacts"
  on public.contacts for insert
  with check (true);

create policy "Allow anyone to delete contacts"
  on public.contacts for delete
  using (true);

-- Create index for faster group queries
create index if not exists contacts_group_name_idx on public.contacts(group_name);
