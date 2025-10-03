import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useMathSession } from '@/hooks/useMathSession'
import { formatTime } from '@/lib/utils'
import { Clock, CheckCircle, XCircle, Star, Sparkles, Trophy, Target } from 'lucide-react'
import { NumericKeypad } from './NumericKeypad'
import type { MathProblem } from '@/types'

interface PlacementTestProps {
  email: string
  gradeLevel: string
  onComplete: (results: any) => void
  onJourneyStateChange?: () => void
}

export function PlacementTest({ email, gradeLevel, onComplete, onJourneyStateChange }: PlacementTestProps) {
  const { startPlacementTest, submitAnswer, getNextProblem, advanceToNextProblem, getCurrentProblem, completeSession, sessionState, loading } = useMathSession()
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; answer: number; timeSpent: number } | null>(null)
  const [sessionStarted, setSessionStarted] = useState(false)

  useEffect(() => {
    if (sessionStarted && !sessionState) {
      startPlacementTest(email, gradeLevel)
    }
  }, [sessionStarted, sessionState, startPlacementTest, email, gradeLevel])

  useEffect(() => {
    if (sessionState && sessionState.problemQueue.length > 0 && !showResult) {
      const problem = getCurrentProblem()
      if (problem && problem !== currentProblem) {
        setCurrentProblem(problem)
        setStartTime(Date.now())
        setTimeSpent(0)
        setUserAnswer('')
      }
    }
  }, [sessionState?.currentProblemIndex, showResult])

  // Separate effect to handle auto-advance after showing result
  useEffect(() => {
    if (showResult && sessionState) {
      const timer = setTimeout(async () => {
        const nextProblem = getNextProblem()
        if (nextProblem) {
          // There are more problems - advance to next and reset result state
          advanceToNextProblem()
          setShowResult(false)
        } else {
          // Test completed
          await completeSession()
          onComplete({
            totalProblems: sessionState.problemQueue.length,
            correctAnswers: sessionState.gridUpdates.filter(g => g.lastAttemptCorrect).length,
            accuracy: Math.round((sessionState.gridUpdates.filter(g => g.lastAttemptCorrect).length / sessionState.problemQueue.length) * 100)
          })
          // Notify parent to refresh journey state
          onJourneyStateChange?.()
        }
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [showResult, sessionState, getNextProblem, advanceToNextProblem, completeSession, onComplete])

  useEffect(() => {
    if (startTime && !showResult) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [startTime, showResult])

  const handleSubmit = async () => {
    if (!currentProblem || !userAnswer) return

    const answer = parseInt(userAnswer)
    if (isNaN(answer)) return

    // Calculate the exact time spent for this question
    const currentTimeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : timeSpent
    
    const result = await submitAnswer(answer, currentTimeSpent)
    setLastResult({ correct: result.correct, answer: currentProblem.answer, timeSpent: currentTimeSpent })
    setShowResult(true)
    setTimeSpent(currentTimeSpent) // Preserve for display
  }

  const handleAnswerChange = (value: string) => {
    setUserAnswer(value)
  }

  if (loading && !sessionState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparing your placement test...</p>
        </div>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with app branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary">Multiplication Wizard</h1>
                <p className="text-muted-foreground italic">A Learning Boltz Experience</p>
              </div>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main placement test card */}
            <div className="lg:col-span-2">
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Target className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl font-bold text-primary">Placement Test</CardTitle>
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-lg text-muted-foreground">
                      🧙‍♂️ Ready to discover your multiplication magic level?
                    </p>
                    <p className="text-muted-foreground">
                      We'll ask you 20 multiplication problems to determine your starting level.
                      Take your time and do your best!
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Fun visual elements */}
                  <div className="flex justify-center items-center gap-4 py-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                        <Star className="h-8 w-8 text-yellow-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">20 Questions</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Trophy className="h-8 w-8 text-blue-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">Find Your Level</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <Sparkles className="h-8 w-8 text-green-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">Start Learning</p>
                    </div>
                  </div>

                  {/* Encouraging message */}
                  <div className="bg-primary/5 rounded-lg p-4 text-center">
                    <p className="text-primary font-medium">
                      ✨ Don't worry if you don't know all the answers - this helps us create the perfect learning path for you!
                    </p>
                  </div>

                  <Button 
                    onClick={() => setSessionStarted(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Start My Magic Test! ✨
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Side panel with fun facts and encouragement */}
            <div className="space-y-6">
              {/* Fun Math Facts */}
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Fun Math Facts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>

              {/* Encouragement Panel */}
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-blue-500" />
                    You've Got This!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🌟</div>
                    <p className="text-sm text-muted-foreground">
                      Every math wizard started with their first spell!
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-sm text-muted-foreground">
                      Mistakes are just learning opportunities in disguise!
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🚀</div>
                    <p className="text-sm text-muted-foreground">
                      Ready to unlock your multiplication superpowers?
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Preview */}
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    What's Next?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Take the placement test</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Get your personalized level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Start practicing with fun games</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Watch your skills grow!</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom encouragement */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary mb-2">Ready to Begin Your Journey?</h3>
              <p className="text-muted-foreground">
                Join thousands of students who have already discovered the magic of multiplication! 
                Your adventure starts with just one click. ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading next problem...</p>
        </div>
      </div>
    )
  }

  const progress = sessionState ? (sessionState.currentProblemIndex / sessionState.problemQueue.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Problem {sessionState?.currentProblemIndex || 0} of {sessionState?.problemQueue.length || 0}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Problem Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Problem Display */}
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {formatTime(timeSpent)}
                </span>
              </div>
              <CardTitle className="text-6xl font-bold text-primary mb-8">
                {currentProblem.multiplicand} × {currentProblem.multiplier} = ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showResult ? (
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    {lastResult?.correct ? (
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    ) : (
                      <XCircle className="h-12 w-12 text-red-500" />
                    )}
                    <span className={`text-4xl font-bold ${lastResult?.correct ? 'text-green-500' : 'text-red-500'}`}>
                      {lastResult?.correct ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  {!lastResult?.correct && (
                    <p className="text-xl text-muted-foreground">
                      The correct answer is <span className="font-bold text-primary">{lastResult?.answer}</span>
                    </p>
                  )}
                  <p className="text-lg text-muted-foreground">
                    Time spent: {formatTime(lastResult?.timeSpent || timeSpent)}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg text-muted-foreground mb-4">
                    Use the number pad to enter your answer
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Numeric Keypad - Always visible, disabled during results */}
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardContent className="p-6">
              <NumericKeypad
                value={userAnswer}
                onChange={handleAnswerChange}
                onSubmit={handleSubmit}
                disabled={showResult}
                maxLength={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Click the numbers to enter your answer, or use your keyboard</p>
        </div>
      </div>
    </div>
  )
}
