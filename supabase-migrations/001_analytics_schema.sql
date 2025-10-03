-- Analytics and Admin Dashboard Schema
-- Migration: 001_analytics_schema.sql

-- Enable timezone support
SET timezone = 'America/New_York';

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('student', 'parent', 'coach', 'admin', 'super_admin')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Question attempts table for detailed tracking
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

-- App configuration for adjustable settings
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily student metrics aggregation table
CREATE TABLE IF NOT EXISTS daily_student_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  app_type TEXT NOT NULL,
  attempted INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  avg_time_seconds NUMERIC(8,2) DEFAULT 0,
  fast_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  slow_count INTEGER DEFAULT 0,
  time_spent_seconds NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, metric_date, app_type)
);

-- Daily difficulty metrics for progression tracking
CREATE TABLE IF NOT EXISTS daily_difficulty_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  app_type TEXT NOT NULL,
  difficulty_band TEXT CHECK (difficulty_band IN ('basic', 'intermediate', 'advanced')) NOT NULL,
  attempted INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  avg_time_seconds NUMERIC(8,2) DEFAULT 0,
  time_spent_seconds NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, metric_date, app_type, difficulty_band)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

CREATE INDEX IF NOT EXISTS idx_question_attempts_student_date ON question_attempts(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_question_attempts_student_date_classification ON question_attempts(student_id, created_at, time_classification);
CREATE INDEX IF NOT EXISTS idx_question_attempts_student_multiplicand_multiplier ON question_attempts(student_id, multiplicand, multiplier);
CREATE INDEX IF NOT EXISTS idx_question_attempts_et_date ON question_attempts((created_at AT TIME ZONE 'America/New_York')::date);

CREATE INDEX IF NOT EXISTS idx_daily_student_metrics_student_date ON daily_student_metrics(student_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_student_metrics_date ON daily_student_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_student_metrics_app_type ON daily_student_metrics(app_type);

CREATE INDEX IF NOT EXISTS idx_daily_difficulty_metrics_student_date ON daily_difficulty_metrics(student_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_difficulty_metrics_date ON daily_difficulty_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_difficulty_metrics_difficulty ON daily_difficulty_metrics(difficulty_band);

-- Insert default time bucket configuration
INSERT INTO app_config (key, value, description) VALUES 
('time_buckets', '{"fast_threshold": 5, "medium_threshold": 15}', 'Time classification thresholds in seconds')
ON CONFLICT (key) DO NOTHING;

-- Function to check if user is super admin (must be defined before RLS policies)
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get difficulty band based on multiplicand and multiplier
CREATE OR REPLACE FUNCTION get_difficulty_band(multiplicand INTEGER, multiplier INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF GREATEST(multiplicand, multiplier) <= 5 THEN
    RETURN 'basic';
  ELSIF GREATEST(multiplicand, multiplier) <= 9 THEN
    RETURN 'intermediate';
  ELSE
    RETURN 'advanced';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to upsert daily student metrics
CREATE OR REPLACE FUNCTION upsert_daily_student_metrics()
RETURNS TRIGGER AS $$
DECLARE
  et_date DATE;
  time_buckets JSONB;
  fast_threshold NUMERIC;
  medium_threshold NUMERIC;
  time_classification TEXT;
BEGIN
  -- Get Eastern Time date
  et_date := (NEW.created_at AT TIME ZONE 'America/New_York')::date;
  
  -- Get time bucket configuration
  SELECT value INTO time_buckets FROM app_config WHERE key = 'time_buckets';
  fast_threshold := (time_buckets->>'fast_threshold')::NUMERIC;
  medium_threshold := (time_buckets->>'medium_threshold')::NUMERIC;
  
  -- Determine time classification
  IF NEW.time_spent_seconds < fast_threshold THEN
    time_classification := 'fast';
  ELSIF NEW.time_spent_seconds <= medium_threshold THEN
    time_classification := 'medium';
  ELSE
    time_classification := 'slow';
  END IF;
  
  -- Upsert daily student metrics
  INSERT INTO daily_student_metrics (
    student_id, metric_date, app_type, attempted, correct, 
    avg_time_seconds, fast_count, medium_count, slow_count, time_spent_seconds
  ) VALUES (
    NEW.student_id, et_date, 'math', 1, 
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    NEW.time_spent_seconds,
    CASE WHEN time_classification = 'fast' THEN 1 ELSE 0 END,
    CASE WHEN time_classification = 'medium' THEN 1 ELSE 0 END,
    CASE WHEN time_classification = 'slow' THEN 1 ELSE 0 END,
    NEW.time_spent_seconds
  )
  ON CONFLICT (student_id, metric_date, app_type) 
  DO UPDATE SET
    attempted = daily_student_metrics.attempted + 1,
    correct = daily_student_metrics.correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    avg_time_seconds = (daily_student_metrics.avg_time_seconds * daily_student_metrics.attempted + NEW.time_spent_seconds) / (daily_student_metrics.attempted + 1),
    fast_count = daily_student_metrics.fast_count + CASE WHEN time_classification = 'fast' THEN 1 ELSE 0 END,
    medium_count = daily_student_metrics.medium_count + CASE WHEN time_classification = 'medium' THEN 1 ELSE 0 END,
    slow_count = daily_student_metrics.slow_count + CASE WHEN time_classification = 'slow' THEN 1 ELSE 0 END,
    time_spent_seconds = daily_student_metrics.time_spent_seconds + NEW.time_spent_seconds,
    updated_at = NOW();
  
  -- Upsert daily difficulty metrics
  INSERT INTO daily_difficulty_metrics (
    student_id, metric_date, app_type, difficulty_band, attempted, correct, 
    avg_time_seconds, time_spent_seconds
  ) VALUES (
    NEW.student_id, et_date, 'math', get_difficulty_band(NEW.multiplicand, NEW.multiplier), 1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    NEW.time_spent_seconds,
    NEW.time_spent_seconds
  )
  ON CONFLICT (student_id, metric_date, app_type, difficulty_band)
  DO UPDATE SET
    attempted = daily_difficulty_metrics.attempted + 1,
    correct = daily_difficulty_metrics.correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    avg_time_seconds = (daily_difficulty_metrics.avg_time_seconds * daily_difficulty_metrics.attempted + NEW.time_spent_seconds) / (daily_difficulty_metrics.attempted + 1),
    time_spent_seconds = daily_difficulty_metrics.time_spent_seconds + NEW.time_spent_seconds,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic aggregation
DROP TRIGGER IF EXISTS trigger_upsert_daily_metrics ON question_attempts;
CREATE TRIGGER trigger_upsert_daily_metrics
  AFTER INSERT ON question_attempts
  FOR EACH ROW
  EXECUTE FUNCTION upsert_daily_student_metrics();

-- RLS Policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_student_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_difficulty_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- User roles policies (fixed to avoid infinite recursion)
CREATE POLICY "Users can read own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all roles" ON user_roles
  FOR SELECT USING (
    user_id IN (
      SELECT user_id FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
      LIMIT 1
    )
  );

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

CREATE POLICY "Users can read own difficulty metrics" ON daily_difficulty_metrics
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Super admins can read all difficulty metrics" ON daily_difficulty_metrics
  FOR SELECT USING (is_super_admin(auth.uid()));

-- App config policies
CREATE POLICY "Everyone can read app config" ON app_config
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage app config" ON app_config
  FOR ALL USING (is_super_admin(auth.uid()));

-- Function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT role FROM user_roles WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
