begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration text not null unique,
  course text,
  class_group text,
  email text,
  photo text,
  face_descriptor jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_registration on public.students (registration);
create index if not exists idx_students_course on public.students (course);
create index if not exists idx_students_class_group on public.students (class_group);

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row
execute function public.set_updated_at();

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  isbn text,
  category text not null default 'Geral',
  rfid text,
  copy_code text,
  course text,
  discipline text,
  location text,
  row_code text,
  shelf text,
  cover text,
  copies integer not null default 1 check (copies >= 0),
  available integer not null default 1 check (available >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available <= copies)
);

create index if not exists idx_books_title on public.books (title);
create index if not exists idx_books_author on public.books (author);
create unique index if not exists idx_books_isbn on public.books (isbn) where isbn is not null;
create unique index if not exists idx_books_rfid on public.books (rfid) where rfid is not null;
create unique index if not exists idx_books_copy_code on public.books (copy_code) where copy_code is not null;
create index if not exists idx_books_location on public.books (location);
create index if not exists idx_books_row_code on public.books (row_code);

drop trigger if exists set_books_updated_at on public.books;
create trigger set_books_updated_at
before update on public.books
for each row
execute function public.set_updated_at();

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  type text not null check (type in ('entry', 'exit')),
  method text not null default 'manual' check (method in ('face', 'qr', 'manual')),
  notes text,
  timestamp timestamptz not null default now()
);

create index if not exists idx_sessions_student on public.sessions (student_id, timestamp desc);
create index if not exists idx_sessions_timestamp on public.sessions (timestamp desc);
create index if not exists idx_sessions_type on public.sessions (type);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  book_id uuid not null references public.books(id) on delete restrict,
  loan_date timestamptz not null default now(),
  due_date timestamptz not null,
  return_date timestamptz,
  status text not null default 'active' check (status in ('active', 'returned', 'overdue')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_loans_student on public.loans (student_id);
create index if not exists idx_loans_book on public.loans (book_id);
create index if not exists idx_loans_status on public.loans (status);
create index if not exists idx_loans_due_date on public.loans (due_date);

drop trigger if exists set_loans_updated_at on public.loans;
create trigger set_loans_updated_at
before update on public.loans
for each row
execute function public.set_updated_at();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  actor text not null default 'system',
  payload jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create index if not exists idx_events_timestamp on public.events (timestamp desc);
create index if not exists idx_events_type on public.events (type);

alter table public.students enable row level security;
alter table public.books enable row level security;
alter table public.sessions enable row level security;
alter table public.loans enable row level security;
alter table public.events enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table public.students, public.books, public.sessions, public.loans, public.events from anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table public.students, public.books, public.sessions, public.loans, public.events from authenticated;
  end if;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.students, public.books, public.sessions, public.loans, public.events to service_role;
  end if;
end $$;

commit;
