-- ============================================================================
-- Seed admin user
--
-- Run this AFTER schema.sql.
-- Creates the auth user + the profile (via on_auth_user_created trigger).
--
-- ⚠️  CHANGE the email/password before running, or after the first test.
--     The bcrypt hash is computed by crypt() so the password is never stored
--     in plaintext anywhere.
-- ============================================================================

-- Defaults — edit these two values:
do $$
declare
  admin_email text := 'admin@uclm.edu.ph';
  admin_password text := 'TaskChamp2026!';
  admin_name text := 'TaskChamp Admin';
  admin_id uuid;
begin
  -- Skip if this admin already exists
  if exists (select 1 from auth.users where email = admin_email) then
    raise notice 'Admin user % already exists — skipping insert. Promoting to admin.', admin_email;
    update public.profiles set role = 'admin' where email = admin_email;
    return;
  end if;

  admin_id := gen_random_uuid();

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    admin_id,
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    now(),                             -- email_confirmed_at: bypasses email confirm
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'name',    admin_name,
      'role',    'admin',                -- handle_new_user() reads this and sets profile role
      'course',  null,
      'education_level', null
    ),
    false,
    '', '', '', ''
  );

  -- Insert the matching auth.identities row so password sign-in works
  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    admin_id::text,
    admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', admin_email),
    'email',
    now(),
    now(),
    now()
  );

  -- Belt-and-suspenders: ensure profile role is admin even if trigger metadata
  -- fallback ran without role.
  update public.profiles set role = 'admin' where id = admin_id;

  raise notice 'Created admin user % with id %', admin_email, admin_id;
end $$;
