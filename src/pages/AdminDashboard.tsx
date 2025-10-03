import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { KpiCard } from '@/components/admin/KpiCard'
import { TrendChart } from '@/components/admin/TrendChart'
import { DifficultyBreakdown } from '@/components/admin/DifficultyBreakdown'
import { StudentsTable } from '@/components/admin/StudentsTable'
import { 
  BarChart3, 
  Users, 
  Target, 
  Clock, 
  TrendingUp, 
  LogOut,
  Filter
} from 'lucide-react'
import { createApiClient } from '@/lib/api-client'
import type { CohortMetrics, StudentSummary, TimeBucketConfig } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiClient = createApiClient(supabaseUrl, supabaseKey)

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { user } = useAuth()
  const [cohortMetrics, setCohortMetrics] = useState<CohortMetrics | null>(null)
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [timeBucketConfig, setTimeBucketConfig] = useState<TimeBucketConfig>({ fastThreshold: 5, mediumThreshold: 15 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [gradeLevel, setGradeLevel] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange, gradeLevel, currentPage])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch cohort metrics
      const metrics = await apiClient.getCohortMetrics({
        startDate: dateRange.from,
        endDate: dateRange.to,
        gradeLevel: gradeLevel || undefined
      })
      setCohortMetrics(metrics)

      // Fetch students list
      const studentsData = await apiClient.listStudents({
        page: currentPage,
        pageSize,
        gradeLevel: gradeLevel || undefined
      })
      setStudents(studentsData.students)
      setTotalStudents(studentsData.total)

      // Fetch time bucket configuration
      const config = await apiClient.getTimeBucketConfig()
      setTimeBucketConfig(config)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeBucketConfigUpdate = async (newConfig: TimeBucketConfig) => {
    try {
      await apiClient.setTimeBucketConfig(newConfig)
      setTimeBucketConfig(newConfig)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update time bucket configuration')
    }
  }

  if (loading && !cohortMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchDashboardData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Multiplication Wizard</h1>
              <p className="text-muted-foreground italic">A Learning Boltz Experience</p>
              <p className="text-sm text-muted-foreground">Admin Dashboard - Welcome, {user?.user_metadata?.display_name || user?.email}</p>
            </div>
          </div>
          <Button onClick={onLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Filters */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Grade Level</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Grades</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Time Buckets</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Fast threshold"
                    value={timeBucketConfig.fastThreshold}
                    onChange={(e) => setTimeBucketConfig(prev => ({ ...prev, fastThreshold: parseInt(e.target.value) || 5 }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Medium threshold"
                    value={timeBucketConfig.mediumThreshold}
                    onChange={(e) => setTimeBucketConfig(prev => ({ ...prev, mediumThreshold: parseInt(e.target.value) || 15 }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleTimeBucketConfigUpdate(timeBucketConfig)}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {cohortMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard
              title="Total Students"
              value={cohortMetrics.totalStudents.toString()}
              icon={<Users className="h-5 w-5" />}
              trend="+12%"
              trendUp={true}
            />
            <KpiCard
              title="Total Attempts"
              value={cohortMetrics.totalAttempts.toLocaleString()}
              icon={<Target className="h-5 w-5" />}
              trend="+8%"
              trendUp={true}
            />
            <KpiCard
              title="Average Accuracy"
              value={`${cohortMetrics.averageAccuracy.toFixed(1)}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              trend="+3%"
              trendUp={true}
            />
            <KpiCard
              title="Avg Time/Question"
              value={`${cohortMetrics.averageTimePerQuestion.toFixed(1)}s`}
              icon={<Clock className="h-5 w-5" />}
              trend="-5%"
              trendUp={true}
            />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TrendChart
            title="Daily Activity Trends"
            data={[]} // TODO: Implement trend data
            loading={loading}
          />
          <DifficultyBreakdown
            title="Difficulty Performance"
            data={cohortMetrics?.difficultyBreakdown}
            loading={loading}
          />
        </div>

        {/* Students Table */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Students Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentsTable
              students={students}
              loading={loading}
              currentPage={currentPage}
              totalPages={Math.ceil(totalStudents / pageSize)}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
