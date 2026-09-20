-- Lets the client (anon key) check whether an email already has an account,
-- without exposing anything beyond that yes/no. Used by the login screen to
-- tell a new user to sign up instead of showing a generic "invalid
-- credentials" error, and by the sign-up screen to point an existing user
-- back to login instead of a raw "user already registered" error.
--
-- Run this once in the Supabase SQL editor (or via the CLI) for this project.

create or replace function public.email_exists(check_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(check_email)
  );
$$;

revoke all on function public.email_exists(text) from public;
grant execute on function public.email_exists(text) to anon, authenticated;
