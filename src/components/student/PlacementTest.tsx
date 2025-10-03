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
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Placement Test</CardTitle>
            <p className="text-muted-foreground">
              We'll ask you 20 multiplication problems to determine your starting level.
              Take your time and do your best!
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setSessionStarted(true)}
              className="w-full"
              size="lg"
            >
              Start Placement Test
            </Button>
          </CardContent>
        </Card>
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
