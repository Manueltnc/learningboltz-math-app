import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useStudentJourney } from '@/hooks/useStudentJourney'
import { PlacementTest } from '@/components/student/PlacementTest'
import { PracticeGrid } from '@/components/student/PracticeGrid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Target, Clock, ArrowLeft } from 'lucide-react'

interface PracticePageProps {
  onBack: () => void
  autoStart?: boolean
  desiredMode?: 'practice' | 'placement'
}

export function PracticePage({ onBack, autoStart = false, desiredMode }: PracticePageProps) {
  const { user } = useAuth()
  const { journeyState, refreshJourneyState, needsPlacement, canStartPractice, loading: journeyLoading } = useStudentJourney()
  const [mode, setMode] = useState<'placement' | 'practice' | 'results' | null>(null)
  const [placementResults, setPlacementResults] = useState<any>(null)

  // Deterministic mode resolution based on desiredMode and journey state
  useEffect(() => {
    if (autoStart && user?.email && !mode && !journeyLoading) {
      if (desiredMode === 'practice') {
        if (canStartPractice) {
          setMode('practice')
        } else if (needsPlacement) {
          // Don't set mode yet - will show gate screen
        }
      } else if (desiredMode === 'placement') {
        setMode('placement')
      } else {
        // Legacy auto-resolution when no desiredMode specified
        if (needsPlacement) {
          setMode('placement')
        } else if (canStartPractice) {
          setMode('practice')
        }
      }
    }
  }, [autoStart, user?.email, mode, needsPlacement, canStartPractice, desiredMode, journeyLoading])

  const handlePlacementComplete = async (results: any) => {
    setPlacementResults(results)
    setMode('results')
    // Refresh journey state so the system knows placement is completed
    await refreshJourneyState()
  }

  const handlePracticeComplete = () => {
    setMode('results')
  }

  const handleStartPractice = () => {
    // Simply set mode to practice - let useEffect handle state synchronization
    setMode('practice')
  }

  const handleStartPlacement = () => {
    setMode('placement')
  }

  if (!user?.email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please log in to access practice mode</p>
            <Button onClick={onBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading screen while journey state is being fetched
  if (journeyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Gate screen: user wants practice but needs placement first
  if (desiredMode === 'practice' && needsPlacement && !mode) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Complete Placement First</CardTitle>
            <p className="text-muted-foreground">
              You need to complete a placement test before starting practice sessions.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleStartPlacement} className="w-full" size="lg">
              <Target className="h-4 w-4 mr-2" />
              Start Placement Test
            </Button>
            <Button onClick={onBack} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mode === 'placement') {
    return (
      <PlacementTest
        email={user.email}
        gradeLevel={user.user_metadata?.grade_level || '3'}
        onComplete={handlePlacementComplete}
        onJourneyStateChange={() => {
          // Refresh the parent's journey state when placement completes
          window.location.reload() // Simple refresh for now
        }}
      />
    )
  }

  if (mode === 'practice') {
    return (
      <PracticeGrid
        email={user.email}
        gradeLevel={user.user_metadata?.grade_level || '3'}
        onComplete={handlePracticeComplete}
      />
    )
  }

  if (mode === 'results' && placementResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button onClick={onBack} variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">Placement Test Complete!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-muted-foreground">Problems Attempted</span>
                  </div>
                  <p className="text-3xl font-bold text-primary">{placementResults.totalProblems}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">Correct Answers</span>
                  </div>
                  <p className="text-3xl font-bold text-primary">{placementResults.correctAnswers}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium text-muted-foreground">Accuracy</span>
                  </div>
                  <p className="text-3xl font-bold text-primary">{placementResults.accuracy}%</p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Great job! Your placement test is complete. You can now start practicing multiplication problems.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleStartPractice} size="lg">
                    <Target className="h-4 w-4 mr-2" />
                    Start Practice Session
                  </Button>
                  <Button onClick={onBack} variant="outline" size="lg">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Default mode selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Placement Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Take a placement test to determine your starting level. This helps us create your personalized learning path.
              </p>
              <Button onClick={handleStartPlacement} className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Start Placement Test
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Practice Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Practice multiplication problems for up to 10 minutes. Focus on problems you haven't mastered yet!
              </p>
              <Button onClick={handleStartPractice} className="w-full">
                <Trophy className="h-4 w-4 mr-2" />
                Start Practice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
