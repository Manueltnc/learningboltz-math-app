import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { useGridProgress } from '@/hooks/useGridProgress'
import { useStudentJourney } from '@/hooks/useStudentJourney'
import { Calculator, Target, Trophy, BarChart3, Play, BookOpen, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ProgressGridModal } from '@/components/student/ProgressGridModal'

interface StudentHomeProps {
  onStartPlacement: (mode: 'placement') => void
  onStartPractice: (mode: 'practice') => void
  onViewProgress: () => void
  onLogout: () => void
}

export function StudentHome({ onStartPlacement, onStartPractice, onViewProgress, onLogout }: StudentHomeProps) {
  const { user } = useAuth()
  const { progress, loading: progressLoading, fetchProgress, getMasteryPercentage, getGuardrailMasteryPercentage } = useGridProgress()
  const { journeyState, loading: journeyLoading, shouldShowPlacement, canStartPractice, refreshJourneyState } = useStudentJourney()
  const [showProgressModal, setShowProgressModal] = useState(false)

  useEffect(() => {
    if (user?.email) {
      // Fetch progress (only if practice is ready)
      if (canStartPractice) {
        fetchProgress(user.email, user.user_metadata?.grade_level || '3')
      }
    }
  }, [user, fetchProgress, canStartPractice])

  if (journeyLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const displayName = user?.user_metadata?.display_name || user?.email || 'Student'
  const gradeLevel = user?.user_metadata?.grade_level || '3'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Multiplication Wizard</h1>
              <p className="text-muted-foreground italic">A Learning Boltz Experience</p>
              <p className="text-sm text-muted-foreground">Welcome back, {displayName}!</p>
            </div>
          </div>
          <Button onClick={onLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Progress Overview */}
        {progress && (
          <div className="mb-8">
            <Card className="backdrop-blur-sm bg-white/80 border-white/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-medium text-muted-foreground">Overall Mastery</span>
                    </div>
                    <p className="text-3xl font-bold text-primary">{getMasteryPercentage()}%</p>
                    <Progress value={getMasteryPercentage()} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-muted-foreground">Guardrail Mastery</span>
                    </div>
                    <p className="text-3xl font-bold text-primary">{getGuardrailMasteryPercentage()}%</p>
                    <Progress value={getGuardrailMasteryPercentage()} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-muted-foreground">Current Level</span>
                    </div>
                    <p className="text-3xl font-bold text-primary">{progress.currentGuardrail}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Grade {gradeLevel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placement Test - Only show if needed */}
          {shouldShowPlacement && (
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Placement Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Take a placement test to determine your starting level and create your personalized learning path.
                </p>
                <Button onClick={() => onStartPlacement('placement')} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Placement Test
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Practice Session - Primary action after placement */}
          {canStartPractice && (
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Practice Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Practice multiplication problems for up to 10 minutes. Focus on problems you haven't mastered yet!
                </p>
                <Button 
                  onClick={() => onStartPractice('practice')} 
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Progress Grid - Only show when practice is ready */}
          {canStartPractice && (
            <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Progress Grid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  View your detailed progress grid and see which multiplication facts you've mastered.
                </p>
                <div className="space-y-3">
                  <Button onClick={onViewProgress} variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Full Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        {progress && (
          <div className="mt-8">
            <Card className="backdrop-blur-sm bg-white/80 border-white/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{progress.totalCorrectAnswers}</p>
                    <p className="text-sm text-muted-foreground">Total Correct</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{progress.totalAttempts}</p>
                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {progress.totalAttempts > 0 ? Math.round((progress.totalCorrectAnswers / progress.totalAttempts) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {progress.gridState.flat().filter(cell => cell.consecutiveCorrect >= 3).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Mastered Facts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Grid Modal */}
        {user?.email && (
          <ProgressGridModal
            email={user.email}
            gradeLevel={user.user_metadata?.grade_level || '3'}
            isOpen={showProgressModal}
            onClose={() => setShowProgressModal(false)}
          />
        )}
      </div>
    </div>
  )
}
