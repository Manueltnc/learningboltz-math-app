# Deployment Instructions - Simplified Auth Approach

## Database Migration Steps

Run these SQL files in your Supabase SQL Editor **in this exact order**:

### 1. Run `000_SIMPLIFIED_AUTH.sql` (NEW APPROACH)
This implements the simplified auth approach using `auth.users` metadata instead of separate tables.

**Location:** `supabase-migrations/000_SIMPLIFIED_AUTH.sql`

This file:
- ✅ Removes complex `user_roles` table 
- ✅ Uses `auth.users.raw_user_meta_data->>'role'` for role checking
- ✅ Creates simple, clean RLS policies
- ✅ Creates the `question_attempts` table with proper indexes
- ✅ Sets up helper functions that use auth metadata

### 2. Run `001_analytics_schema.sql`
This creates the analytics schema with daily metrics tables.

**Location:** `supabase-migrations/001_analytics_schema.sql`

This file creates:
- `daily_student_metrics` table
- `daily_difficulty_metrics` table
- `app_config` table
- All necessary functions and triggers
- Indexes for performance

### 3. Run `002_reconciliation_job.sql` (Optional)
This creates the nightly reconciliation job for data consistency.

**Location:** `supabase-migrations/002_reconciliation_job.sql`

### 4. Run `004_role_utilities.sql`
This creates helper functions for managing roles in auth metadata.

**Location:** `supabase-migrations/004_role_utilities.sql`

## After Migration

### Create Your First Super Admin

Run this in the Supabase SQL Editor while logged in as the user you want to make super admin:

```sql
SELECT make_current_user_super_admin();
```

Or assign super admin to a specific user by email:

```sql
SELECT set_user_role('your-email@example.com', 'super_admin');
```

### Set Other Roles

Assign roles to users by email:

```sql
-- Make someone a coach
SELECT set_user_role('coach@example.com', 'coach');

-- Make someone a student (default)
SELECT set_user_role('student@example.com', 'student');

-- List all users and their roles
SELECT * FROM list_users_with_roles();
```

### Verify Everything Works

1. **Check tables exist:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_roles', 'question_attempts', 'daily_student_metrics', 'daily_difficulty_metrics', 'app_config')
ORDER BY table_name;
```

2. **Check policies are in place:**
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('user_roles', 'question_attempts', 'daily_student_metrics', 'daily_difficulty_metrics', 'app_config')
ORDER BY tablename, policyname;
```

3. **Test the application:**
   - Refresh your browser
   - Log in as a student
   - Start a placement test
   - Answer questions
   - Verify no 500 errors in console

## Troubleshooting

### If you get "relation already exists" errors:
This is fine - the migrations use `IF NOT EXISTS` clauses, so they won't break existing tables.

### If you still get RLS infinite recursion errors:
Drop and recreate the policies by running `000_APPLY_THIS_FIRST.sql` again.

### If the trigger isn't working:
Check that the trigger exists:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_upsert_daily_metrics';
```

If missing, run:
```sql
CREATE TRIGGER trigger_upsert_daily_metrics
  AFTER INSERT ON question_attempts
  FOR EACH ROW
  EXECUTE FUNCTION upsert_daily_student_metrics();
```

## Clean Up

After successful deployment, this file and the migration files in `supabase-migrations/` are the only files you need. All other temporary fix files have been removed.
