-- Fix ENUM Type Conflict
-- This script cleans up duplicate ENUM types left from failed migrations

-- Step 1: Check what ENUM types exist
SELECT n.nspname AS schema, t.typname AS enum_name
FROM pg_type t 
JOIN pg_namespace n ON n.oid = t.typnamespace 
WHERE t.typtype = 'e' 
  AND n.nspname = 'public'
  AND t.typname LIKE '%admin%';

-- Step 2: Drop the duplicate ENUM type if it exists
DROP TYPE IF EXISTS "public"."institution_admins_role_enum" CASCADE;

-- Step 3: Drop the old backup ENUM if it exists
DROP TYPE IF EXISTS "public"."admin_role_old" CASCADE;

-- Step 4: Verify the main admin_role ENUM exists and has correct values
DO $$
BEGIN
    -- Check if admin_role type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
        -- Create it if it doesn't exist
        CREATE TYPE "public"."admin_role" AS ENUM('SUPER_ADMIN', 'REGISTRAR', 'VIEWER');
        RAISE NOTICE 'Created admin_role ENUM type';
    ELSE
        RAISE NOTICE 'admin_role ENUM type already exists';
    END IF;
END
$$;

-- Step 5: Verify the institution_admins table is using the correct ENUM
SELECT 
    table_name, 
    column_name, 
    udt_name AS enum_type
FROM information_schema.columns
WHERE table_name = 'institution_admins' 
  AND column_name = 'role';

-- If you see the role column using 'admin_role', you're good!
-- If it shows 'institution_admins_role_enum', run this additional fix:

-- OPTIONAL: Only run if needed to fix the column type
-- ALTER TABLE institution_admins 
--   ALTER COLUMN role TYPE admin_role 
--   USING role::text::admin_role;
