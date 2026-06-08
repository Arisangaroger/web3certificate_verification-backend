-- Clean up duplicate ENUM types from failed migration
-- Run this in your PostgreSQL database

-- Step 1: Drop any orphaned ENUM types
DROP TYPE IF EXISTS "public"."institution_admins_role_enum" CASCADE;
DROP TYPE IF EXISTS "public"."admin_role_old" CASCADE;

-- Step 2: Verify admin_role exists with correct values
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' 
  AND t.typname = 'admin_role'
ORDER BY e.enumsortorder;

-- Should show:
-- admin_role | SUPER_ADMIN
-- admin_role | REGISTRAR
-- admin_role | VIEWER

-- Step 3: Verify institution_admins table uses admin_role
SELECT 
    table_name, 
    column_name, 
    udt_name AS enum_type_used
FROM information_schema.columns
WHERE table_name = 'institution_admins' 
  AND column_name = 'role';

-- Should show: institution_admins | role | admin_role
