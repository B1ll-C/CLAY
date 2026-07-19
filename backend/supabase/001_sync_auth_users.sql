-- Run once, by hand, in the Supabase SQL editor for this project.
-- Not a Drizzle migration: drizzle-kit is scoped to the `public` schema only
-- (see drizzle.config.ts `schemaFilter`) and cannot own a trigger on `auth.users`.
--
-- Keeps `public.users` (the app's slim profile row — see
-- backend/src/db/schema/users.ts) in sync with Supabase Auth's own
-- `auth.users` table whenever a new account is created.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
