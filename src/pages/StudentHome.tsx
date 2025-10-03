import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { useGridProgress } from '@/hooks/useGridProgress'
import { useStudentJourney } from '@/hooks/useStudentJourney'
import { Calculator, Target, Trophy, BarChart3, Play, BookOpen, LogOut, Star, Sparkles, Clock, Users, Award } from 'lucide-react'
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

          {/* Additional cards to fill empty space when only placement test is shown */}
          {shouldShowPlacement && !canStartPractice && (
            <>
              {/* Fun Math Facts Card */}
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Fun Math Facts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        🧮 Did you know? 7 × 8 = 56 is one of the trickiest multiplication facts!
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        ⚡ Quick tip: Any number × 10 = just add a zero at the end!
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        🎯 Practice makes perfect! The more you practice, the faster you'll get!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What You'll Learn Card */}
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-500" />
                    What You'll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Master all multiplication facts 1-12</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Build speed and accuracy</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Track your progress with fun games</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Earn achievements and rewards</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Encouragement Card */}
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    You've Got This!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    <div className="text-4xl mb-2">🌟</div>
                    <p className="text-sm text-muted-foreground">
                      Every math wizard started with their first spell!
                    </p>
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-sm text-muted-foreground">
                      Mistakes are just learning opportunities in disguise!
                    </p>
                    <div className="text-4xl mb-2">🚀</div>
                    <p className="text-sm text-muted-foreground">
                      Ready to unlock your multiplication superpowers?
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* How It Works Card */}
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Take Placement Test</p>
                        <p className="text-xs text-muted-foreground">We'll find your perfect starting level</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Practice & Learn</p>
                        <p className="text-xs text-muted-foreground">Work on problems at your level</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Track Progress</p>
                        <p className="text-xs text-muted-foreground">Watch your skills improve over time</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Stats Card */}
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    Join the Community
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    <div className="text-2xl font-bold text-primary">10,000+</div>
                    <p className="text-sm text-muted-foreground">Students learning with us</p>
                    <div className="text-2xl font-bold text-primary">95%</div>
                    <p className="text-sm text-muted-foreground">Improve their math skills</p>
                    <div className="text-2xl font-bold text-primary">4.8★</div>
                    <p className="text-sm text-muted-foreground">Average rating from students</p>
                  </div>
                </CardContent>
              </Card>
            </>
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

        {/* Bottom encouragement section for placement test only */}
        {shouldShowPlacement && !canStartPractice && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
                <h3 className="text-2xl font-bold text-primary">Ready to Begin Your Journey?</h3>
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of students who have already discovered the magic of multiplication! 
                Your adventure starts with just one click. Take the placement test to unlock your personalized learning path.
              </p>
              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Personalized Learning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Fun & Engaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Track Progress</span>
                </div>
              </div>
            </div>
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
