-- Nightly Reconciliation Job
-- Migration: 002_reconciliation_job.sql

-- Function to reconcile daily metrics for a specific date
CREATE OR REPLACE FUNCTION reconcile_daily_metrics(target_date DATE)
RETURNS VOID AS $$
DECLARE
  time_buckets JSONB;
  fast_threshold NUMERIC;
  medium_threshold NUMERIC;
  attempt_record RECORD;
  et_date DATE;
  time_classification TEXT;
BEGIN
  -- Get time bucket configuration
  SELECT value INTO time_buckets FROM app_config WHERE key = 'time_buckets';
  fast_threshold := (time_buckets->>'fast_threshold')::NUMERIC;
  medium_threshold := (time_buckets->>'medium_threshold')::NUMERIC;
  
  -- Clear existing metrics for the target date
  DELETE FROM daily_student_metrics 
  WHERE metric_date = target_date AND app_type = 'math';
  
  DELETE FROM daily_difficulty_metrics 
  WHERE metric_date = target_date AND app_type = 'math';
  
  -- Re-aggregate from question_attempts
  FOR attempt_record IN
    SELECT 
      student_id,
      multiplicand,
      multiplier,
      is_correct,
      time_spent_seconds,
      created_at
    FROM question_attempts
    WHERE (created_at AT TIME ZONE 'America/New_York')::date = target_date
  LOOP
    -- Determine time classification
    IF attempt_record.time_spent_seconds < fast_threshold THEN
      time_classification := 'fast';
    ELSIF attempt_record.time_spent_seconds <= medium_threshold THEN
      time_classification := 'medium';
    ELSE
      time_classification := 'slow';
    END IF;
    
    -- Upsert daily student metrics
    INSERT INTO daily_student_metrics (
      student_id, metric_date, app_type, attempted, correct, 
      avg_time_seconds, fast_count, medium_count, slow_count, time_spent_seconds
    ) VALUES (
      attempt_record.student_id, target_date, 'math', 1, 
      CASE WHEN attempt_record.is_correct THEN 1 ELSE 0 END,
      attempt_record.time_spent_seconds,
      CASE WHEN time_classification = 'fast' THEN 1 ELSE 0 END,
      CASE WHEN time_classification = 'medium' THEN 1 ELSE 0 END,
      CASE WHEN time_classification = 'slow' THEN 1 ELSE 0 END,
      attempt_record.time_spent_seconds
    )
    ON CONFLICT (student_id, metric_date, app_type) 
    DO UPDATE SET
      attempted = daily_student_metrics.attempted + 1,
      correct = daily_student_metrics.correct + CASE WHEN attempt_record.is_correct THEN 1 ELSE 0 END,
      avg_time_seconds = (daily_student_metrics.avg_time_seconds * daily_student_metrics.attempted + attempt_record.time_spent_seconds) / (daily_student_metrics.attempted + 1),
      fast_count = daily_student_metrics.fast_count + CASE WHEN time_classification = 'fast' THEN 1 ELSE 0 END,
      medium_count = daily_student_metrics.medium_count + CASE WHEN time_classification = 'medium' THEN 1 ELSE 0 END,
      slow_count = daily_student_metrics.slow_count + CASE WHEN time_classification = 'slow' THEN 1 ELSE 0 END,
      time_spent_seconds = daily_student_metrics.time_spent_seconds + attempt_record.time_spent_seconds,
      updated_at = NOW();
    
    -- Upsert daily difficulty metrics
    INSERT INTO daily_difficulty_metrics (
      student_id, metric_date, app_type, difficulty_band, attempted, correct, 
      avg_time_seconds, time_spent_seconds
    ) VALUES (
      attempt_record.student_id, target_date, 'math', 
      get_difficulty_band(attempt_record.multiplicand, attempt_record.multiplier), 1,
      CASE WHEN attempt_record.is_correct THEN 1 ELSE 0 END,
      attempt_record.time_spent_seconds,
      attempt_record.time_spent_seconds
    )
    ON CONFLICT (student_id, metric_date, app_type, difficulty_band)
    DO UPDATE SET
      attempted = daily_difficulty_metrics.attempted + 1,
      correct = daily_difficulty_metrics.correct + CASE WHEN attempt_record.is_correct THEN 1 ELSE 0 END,
      avg_time_seconds = (daily_difficulty_metrics.avg_time_seconds * daily_difficulty_metrics.attempted + attempt_record.time_spent_seconds) / (daily_difficulty_metrics.attempted + 1),
      time_spent_seconds = daily_difficulty_metrics.time_spent_seconds + attempt_record.time_spent_seconds,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to reconcile metrics for the previous day
CREATE OR REPLACE FUNCTION reconcile_previous_day()
RETURNS VOID AS $$
DECLARE
  yesterday DATE;
BEGIN
  yesterday := (CURRENT_DATE AT TIME ZONE 'America/New_York')::date - INTERVAL '1 day';
  PERFORM reconcile_daily_metrics(yesterday);
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled function (requires pg_cron extension)
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the reconciliation job to run daily at 2 AM Eastern Time
-- SELECT cron.schedule(
--   'reconcile-daily-metrics',
--   '0 2 * * *', -- 2 AM daily
--   'SELECT reconcile_previous_day();'
-- );

-- Manual function to run reconciliation for a date range
CREATE OR REPLACE FUNCTION reconcile_date_range(start_date DATE, end_date DATE)
RETURNS VOID AS $$
DECLARE
  current_date DATE;
BEGIN
  current_date := start_date;
  
  WHILE current_date <= end_date LOOP
    PERFORM reconcile_daily_metrics(current_date);
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;
