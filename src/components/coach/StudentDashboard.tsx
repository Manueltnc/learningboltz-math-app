import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { useGridProgress } from '@/hooks/useGridProgress'
import { AIDifficultyAdjustment } from '@/lib/ai-difficulty-adjustment'
import { Users, Trophy, Target, Clock, BarChart3, Brain, AlertTriangle } from 'lucide-react'
import type { Student, StudentProgress } from '@/types'

interface StudentDashboardProps {
  coachId: string
}

export function StudentDashboard({ coachId }: StudentDashboardProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { progress, fetchProgress, getMasteryPercentage, getGuardrailMasteryPercentage } = useGridProgress()

  useEffect(() => {
    fetchStudents()
  }, [coachId])

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentProgress(selectedStudent.id)
      fetchProgress(selectedStudent.email, selectedStudent.gradeLevel)
      generateAIAnalysis(selectedStudent.id)
    }
  }, [selectedStudent, fetchProgress])

  const generateAIAnalysis = async (studentId: string) => {
    try {
      // Get recent session data for AI analysis
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('student_id', studentId)
        .eq('app_type', 'math')
        .order('started_at', { ascending: false })
        .limit(5)

      if (progress && sessions) {
        const analysis = AIDifficultyAdjustment.analyzeStudentPerformance({
          gridState: progress.gridState,
          recentSessions: sessions.map(s => ({
            averageTime: s.average_time_per_question || 0,
            accuracy: s.accuracy || 0,
            fastAnswers: s.fast_answers_count || 0,
            slowAnswers: s.slow_answers_count || 0
          })),
          currentGuardrail: progress.currentGuardrail
        })
        setAiAnalysis(analysis)
      }
    } catch (err) {
      console.error('Failed to generate AI analysis:', err)
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    setError(null)

    try {
      // For now, return empty array since we need to implement proper student management
      // In a real app, this would fetch from a students table or classroom relationships
      setStudents([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentProgress = async (studentId: string) => {
    try {
      // Calculate student progress from learning_sessions and math_grid_progress
      const { data: sessions, error: sessionsError } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('student_id', studentId)
        .eq('app_type', 'math')

      if (sessionsError) throw sessionsError

      const { data: gridData, error: gridError } = await supabase
        .from('math_grid_progress')
        .select('*')
        .eq('student_id', studentId)

      if (gridError) throw gridError

      // Calculate progress statistics
      const totalSessions = sessions?.length || 0
      const totalItemsAttempted = sessions?.reduce((sum, session) => sum + (session.completed_items || 0), 0) || 0
      const totalCorrectAnswers = sessions?.reduce((sum, session) => sum + (session.correct_answers || 0), 0) || 0
      const overallAccuracy = totalItemsAttempted > 0 ? Math.round((totalCorrectAnswers / totalItemsAttempted) * 100) : 0
      const averageSessionTime = totalSessions > 0 ? Math.round(sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) / totalSessions) : 0

      setStudentProgress({
        studentId,
        appType: 'math',
        totalSessions,
        totalItemsAttempted,
        totalCorrectAnswers,
        overallAccuracy,
        averageSessionTime
      })
    } catch (err) {
      console.error('Failed to fetch student progress:', err)
    }
  }

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchStudents} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary text-center">
                Student Dashboard
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students List */}
          <div className="lg:col-span-1">
            <Card className="backdrop-blur-sm bg-white/80 border-white/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students ({students.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                        selectedStudent?.id === student.id
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-white/50 border-white/20 hover:bg-white/70'
                      }`}
                    >
                      <div className="font-medium">{student.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        Grade {student.gradeLevel}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Details */}
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <div className="space-y-6">
                {/* Student Info */}
                <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary">
                      {selectedStudent.displayName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Grade Level</p>
                        <p className="text-lg font-semibold">Grade {selectedStudent.gradeLevel}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-lg font-semibold">{selectedStudent.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="text-lg font-semibold">
                          {new Date(selectedStudent.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="text-lg font-semibold">
                          {new Date(selectedStudent.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Stats */}
                {studentProgress && (
                  <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Progress Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm font-medium text-muted-foreground">Overall Mastery</span>
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            {progress ? getMasteryPercentage() : 0}%
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Target className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium text-muted-foreground">Guardrail Mastery</span>
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            {progress ? getGuardrailMasteryPercentage() : 0}%
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            <span className="text-sm font-medium text-muted-foreground">Total Sessions</span>
                          </div>
                          <p className="text-2xl font-bold text-primary">{studentProgress.totalSessions}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-purple-500" />
                            <span className="text-sm font-medium text-muted-foreground">Avg. Session Time</span>
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            {Math.round(studentProgress.averageSessionTime / 60)}m
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Analysis */}
                {aiAnalysis && (
                  <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-500" />
                        AI Analysis
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          aiAnalysis.confidenceLevel === 'high' ? 'bg-green-100 text-green-800' :
                          aiAnalysis.confidenceLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {aiAnalysis.confidenceLevel} confidence
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {aiAnalysis.strugglingAreas.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Struggling Areas
                          </h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {aiAnalysis.strugglingAreas.map((area: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                {area}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {aiAnalysis.recommendedAdjustments.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-blue-600 mb-2">Recommendations</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {aiAnalysis.recommendedAdjustments.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAnalysis.suggestedGuardrail && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Suggested Action:</strong> Consider changing guardrail to {aiAnalysis.suggestedGuardrail}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Progress Grid Preview */}
                {progress && (
                  <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Progress Grid</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-12 gap-1 max-w-md mx-auto">
                        {Array.from({ length: 12 }, (_, row) =>
                          Array.from({ length: 12 }, (_, col) => {
                            const cell = progress.gridState[row][col]
                            const isOutsideGuardrail = row >= (progress.currentGuardrail === '1-5' ? 5 : progress.currentGuardrail === '1-9' ? 9 : 12) || 
                                                     col >= (progress.currentGuardrail === '1-5' ? 5 : progress.currentGuardrail === '1-9' ? 9 : 12)
                            
                            return (
                              <div
                                key={`${row}-${col}`}
                                className={`
                                  w-6 h-6 rounded border
                                  ${isOutsideGuardrail 
                                    ? 'bg-gray-300 border-gray-400' 
                                    : cell.consecutiveCorrect >= 3 ? 'bg-green-500' :
                                      cell.consecutiveCorrect === 2 ? 'bg-orange-400' :
                                      cell.consecutiveCorrect === 1 ? 'bg-yellow-400' : 'bg-red-400'
                                  }
                                `}
                                title={`${row + 1} × ${col + 1} = ${(row + 1) * (col + 1)} - ${cell.averageTimeSeconds.toFixed(1)}s avg`}
                              />
                            )
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a student to view their progress</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
