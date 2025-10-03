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
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Multiplication Wizard</h1>
              <p className="text-muted-foreground italic">A Learning Boltz Experience</p>
            </div>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">🧙‍♂️ Preparing your magic test...</p>
          <div className="flex justify-center gap-1 mt-4">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
        <div className="max-w-2xl mx-auto">
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

          {/* Main placement test card */}
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
      </div>
    )
  }

  if (!currentProblem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Multiplication Wizard</h1>
              <p className="text-muted-foreground italic">A Learning Boltz Experience</p>
            </div>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">🎯 Loading your next challenge...</p>
          <div className="flex justify-center gap-1 mt-4">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const progress = sessionState ? (sessionState.currentProblemIndex / sessionState.problemQueue.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with app branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Multiplication Wizard</h1>
              <p className="text-muted-foreground italic text-sm">A Learning Boltz Experience</p>
            </div>
          </div>
        </div>

        {/* Progress Bar with fun elements */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Problem {sessionState?.currentProblemIndex || 0} of {sessionState?.problemQueue.length || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-3" />
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400 rounded-full opacity-20"></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">🎯 Keep going!</span>
            <span className="text-xs text-muted-foreground">You're doing great! ✨</span>
          </div>
        </div>

        {/* Problem Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Problem Display */}
          <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  {formatTime(timeSpent)}
                </span>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(timeSpent / 10) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              <div className="relative">
                <CardTitle className="text-6xl font-bold text-primary mb-8 relative">
                  {currentProblem.multiplicand} × {currentProblem.multiplier} = ?
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                  </div>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {showResult ? (
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    {lastResult?.correct ? (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <div>
                          <span className="text-4xl font-bold text-green-500">Correct!</span>
                          <div className="flex justify-center gap-1 mt-2">
                            {[...Array(3)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <XCircle className="h-12 w-12 text-red-500" />
                        <span className="text-4xl font-bold text-red-500">Try Again!</span>
                      </div>
                    )}
                  </div>
                  {!lastResult?.correct && (
                    <div className="bg-primary/5 rounded-lg p-4">
                      <p className="text-xl text-muted-foreground">
                        The correct answer is <span className="font-bold text-primary text-2xl">{lastResult?.answer}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">💡 Remember: {currentProblem.multiplicand} × {currentProblem.multiplier} = {lastResult?.answer}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    Time spent: {formatTime(lastResult?.timeSpent || timeSpent)}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-primary/5 rounded-lg p-4 mb-4">
                    <p className="text-lg text-muted-foreground mb-2">
                      🧮 Use the number pad to enter your answer
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Take your time and think carefully! ✨
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Numeric Keypad - Always visible, disabled during results */}
          <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">{userAnswer.length}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">Your Answer</span>
                {userAnswer && (
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full ${i < userAnswer.length ? 'bg-primary' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
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

        {/* Instructions with fun elements */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>🎯</span>
            <p>Click the numbers to enter your answer, or use your keyboard</p>
            <span>✨</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>🧮 Math is fun!</span>
            <span>•</span>
            <span>🎉 You're doing great!</span>
            <span>•</span>
            <span>⭐ Keep going!</span>
          </div>
        </div>
      </div>
    </div>
  )
}
