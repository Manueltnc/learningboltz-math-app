-- =====================================================
-- SIMPLIFIED AUTH APPROACH: Use auth.users exclusively
-- This replaces the complex user_roles table approach
-- =====================================================

-- Step 1: Drop the complex user_roles table and policies
DROP TABLE IF EXISTS user_roles CASCADE;
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can read all roles" ON user_roles;

-- Step 2: Create simple helper functions that use auth.users metadata
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uuid 
    AND (raw_user_meta_data->>'role' = 'super_admin' OR raw_user_meta_data->>'role' = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = user_uuid),
    'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create question_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  multiplicand INTEGER NOT NULL,
  multiplier INTEGER NOT NULL,
  user_answer INTEGER NOT NULL,
  correct_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds NUMERIC(8,2) NOT NULL,
  time_classification TEXT CHECK (time_classification IN ('fast', 'medium', 'slow')) NOT NULL,
  attempt_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, clean RLS policies

-- Question attempts policies
CREATE POLICY "Users can insert own question attempts" ON question_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can read own question attempts" ON question_attempts
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Super admins can read all question attempts" ON question_attempts
  FOR SELECT USING (is_super_admin(auth.uid()));

-- Daily metrics policies
CREATE POLICY "Users can read own daily metrics" ON daily_student_metrics
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Super admins can read all daily metrics" ON daily_student_metrics
  FOR SELECT USING (is_super_admin(auth.uid()));

-- Difficulty metrics policies  
CREATE POLICY "Users can read own difficulty metrics" ON daily_difficulty_metrics
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Super admins can read all difficulty metrics" ON daily_difficulty_metrics
  FOR SELECT USING (is_super_admin(auth.uid()));

-- App config policies
CREATE POLICY "Everyone can read app config" ON app_config
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage app config" ON app_config
  FOR ALL USING (is_super_admin(auth.uid()));

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_attempts_student_date ON question_attempts(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_question_attempts_student_date_classification ON question_attempts(student_id, created_at, time_classification);
CREATE INDEX IF NOT EXISTS idx_question_attempts_student_multiplicand_multiplier ON question_attempts(student_id, multiplicand, multiplier);
CREATE INDEX IF NOT EXISTS idx_question_attempts_et_date ON question_attempts((created_at AT TIME ZONE 'America/New_York')::date);

-- Step 6: Update API functions to use auth.users metadata
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY[get_user_role(user_uuid)];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Verify installation
DO $$
BEGIN
  RAISE NOTICE 'Simplified auth migration completed successfully!';
  RAISE NOTICE 'question_attempts table: %', (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_attempts'));
  RAISE NOTICE 'is_super_admin function: %', (SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_super_admin'));
  RAISE NOTICE 'get_user_role function: %', (SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_role'));
END $$;
