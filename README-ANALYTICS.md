# Analytics and Admin Dashboard Implementation

This document describes the implementation of the analytics system and admin dashboard for the Math Times Tables application.

## Overview

The analytics system provides comprehensive tracking of student performance, daily metrics, and difficulty progression. It includes:

- **Daily Metrics Tracking**: Time spent, sums attempted, sums correct, average time to solve
- **Difficulty Progression Analytics**: Exposure and performance on harder multiplication facts
- **Configurable Time Buckets**: Fast/medium/slow classification with adjustable thresholds
- **Eastern Time Aggregation**: All daily metrics are aggregated using Eastern Time
- **Role-Based Access**: Student and Super Admin roles with appropriate permissions
- **Admin Dashboard**: Comprehensive view of student metrics and trends

## Database Schema

### New Tables

#### `user_roles`
Stores user role assignments with support for multiple roles per user.
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('student', 'parent', 'coach', 'admin', 'super_admin')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

#### `daily_student_metrics`
Aggregated daily metrics for each student.
```sql
CREATE TABLE daily_student_metrics (
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
```

#### `daily_difficulty_metrics`
Daily metrics broken down by difficulty level.
```sql
CREATE TABLE daily_difficulty_metrics (
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
```

#### `app_config`
Configuration storage for adjustable settings like time bucket thresholds.
```sql
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Functions

#### `get_difficulty_band(multiplicand, multiplier)`
Returns difficulty classification based on the maximum operand value:
- `basic`: max(multiplicand, multiplier) ≤ 5
- `intermediate`: max(multiplicand, multiplier) ≤ 9  
- `advanced`: max(multiplicand, multiplier) ≤ 12

#### `upsert_daily_student_metrics()`
Trigger function that automatically aggregates metrics when new question attempts are inserted.

## API Client Extensions

The `UnifiedApiClient` has been extended with new methods:

### Role Management
- `getUserRoles(userId)`: Get all roles for a user
- `isSuperAdmin(userId)`: Check if user has super admin role

### Analytics
- `getDailyStudentMetrics(studentId, options)`: Get daily metrics for a student
- `getDailyDifficultyMetrics(studentId, options)`: Get difficulty-based metrics
- `getCohortMetrics(options)`: Get aggregated metrics for all students
- `getTimeBucketConfig()`: Get current time bucket configuration
- `setTimeBucketConfig(config)`: Update time bucket thresholds
- `listStudents(options)`: Get paginated list of students with metrics

## Frontend Components

### New Hooks

#### `useRoles`
Manages user role state and provides role checking utilities:
```typescript
const { roles, isSuperAdmin, hasRole, hasAnyRole } = useRoles()
```

### Admin Dashboard

#### `AdminDashboard.tsx`
Main admin interface with:
- KPI cards showing key metrics
- Filters for date range, grade level, and time bucket configuration
- Trend charts (placeholder for future implementation)
- Difficulty breakdown visualization
- Students table with sorting and pagination

#### Admin Components
- `KpiCard.tsx`: Reusable KPI display component
- `TrendChart.tsx`: Chart placeholder component
- `DifficultyBreakdown.tsx`: Difficulty performance visualization
- `StudentsTable.tsx`: Sortable, paginated students table

## Time Classification

Time buckets are configurable via the `app_config` table:

```json
{
  "fast_threshold": 5,    // seconds
  "medium_threshold": 15  // seconds
}
```

Classification logic:
- **Fast**: < fast_threshold seconds
- **Medium**: fast_threshold to medium_threshold seconds
- **Slow**: > medium_threshold seconds

## Eastern Time Handling

All daily aggregations use Eastern Time:
- `metric_date` is derived as `(created_at AT TIME ZONE 'America/New_York')::date`
- Indexes are created on the timezone-converted date
- API responses include dates in YYYY-MM-DD format

## Security

### Row Level Security (RLS)
- Students can only read their own metrics
- Super admins can read all metrics
- Role assignments are protected by RLS policies

### API Security
- All queries are parameterized to prevent SQL injection
- Role-based access control enforced at the database level
- Super admin functions require proper authentication

## Performance Optimizations

### Indexing Strategy
- Composite indexes on frequently queried columns
- Timezone-aware indexes for date-based queries
- Covering indexes to minimize I/O

### Aggregation Strategy
- Real-time aggregation via database triggers
- Pre-computed daily metrics to avoid scanning raw data
- Optional nightly reconciliation job for data consistency

## Testing

### Unit Tests
- `analytics-utils.test.ts`: Utility function tests
- `useRoles.test.tsx`: Role management hook tests
- `AdminDashboard.test.tsx`: Dashboard component tests

### Test Utilities
- `analytics-utils.ts`: Mock data generators and utility functions
- Comprehensive test coverage for all analytics functions

## Deployment

### Migration Scripts
1. `001_analytics_schema.sql`: Core schema and functions
2. `002_reconciliation_job.sql`: Optional nightly reconciliation
3. `003_seed_roles.sql`: Role management utilities

### Setup Instructions
1. Run migration scripts in order
2. Create initial super admin: `SELECT make_current_user_super_admin();`
3. Configure time buckets via admin dashboard or direct SQL

## Future Enhancements

### Planned Features
- Advanced charting with real data visualization
- Export functionality for metrics
- Automated reporting and alerts
- Parent and coach role implementations
- Rollback metric tracking (deferred)

### Performance Improvements
- Caching layer for frequently accessed metrics
- Background job processing for heavy aggregations
- Real-time dashboard updates via WebSocket

## Monitoring

### Key Metrics to Monitor
- Daily aggregation performance
- Query execution times
- Storage growth rates
- User engagement patterns

### Alerts
- Failed aggregation jobs
- Unusual performance patterns
- Storage threshold breaches
- High error rates

## Troubleshooting

### Common Issues
1. **Missing metrics**: Check trigger function and timezone settings
2. **Permission errors**: Verify RLS policies and user roles
3. **Performance issues**: Review index usage and query patterns
4. **Data inconsistencies**: Run reconciliation job manually

### Debug Queries
```sql
-- Check daily metrics for a student
SELECT * FROM daily_student_metrics 
WHERE student_id = 'user-id' 
ORDER BY metric_date DESC;

-- Verify trigger function
SELECT * FROM question_attempts 
WHERE student_id = 'user-id' 
ORDER BY created_at DESC LIMIT 10;

-- Check user roles
SELECT * FROM user_roles WHERE user_id = 'user-id';
```
