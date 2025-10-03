import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EquationProblem } from '@/components/ui/EquationDisplay'
import { formatTime } from '@/lib/utils'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { NumericKeypad } from './NumericKeypad'
import type { MathProblem } from '@/types'

interface MathProblemProps {
  problem: MathProblem
  onAnswer: (answer: number, timeSpent: number) => Promise<{ correct: boolean }>
  onComplete: () => void
  isLastProblem?: boolean
}

export function MathProblem({ problem, onAnswer, onComplete, isLastProblem = false }: MathProblemProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; answer: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setStartTime(Date.now())
    setTimeSpent(0)
    setUserAnswer('')
    setShowResult(false)
    setLastResult(null)
  }, [problem])

  useEffect(() => {
    if (startTime && !showResult) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [startTime, showResult])

  const handleSubmit = async () => {
    if (!userAnswer || submitting) return

    const answer = parseInt(userAnswer)
    if (isNaN(answer)) return

    setSubmitting(true)
    const result = await onAnswer(answer, timeSpent)
    setLastResult({ correct: result.correct, answer: problem.answer })
    setShowResult(true)
    setSubmitting(false)

    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (isLastProblem) {
        onComplete()
      } else {
        // Reset for next problem
        setStartTime(Date.now())
        setTimeSpent(0)
        setUserAnswer('')
        setShowResult(false)
        setLastResult(null)
      }
    }, 2000)
  }

  const handleAnswerChange = (value: string) => {
    setUserAnswer(value)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Problem Display */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {formatTime(timeSpent)}
            </span>
          </div>
          <div className="flex items-center justify-center mb-8">
            <EquationProblem
              multiplicand={problem.multiplicand}
              multiplier={problem.multiplier}
              size="6xl"
              variant="horizontal"
              className="text-primary font-bold"
            />
          </div>
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
                Time spent: {formatTime(timeSpent)}
              </p>
              {isLastProblem && (
                <p className="text-lg text-muted-foreground">
                  Great job! Session completed.
                </p>
              )}
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

      {/* Numeric Keypad */}
      {!showResult && (
        <Card className="backdrop-blur-sm bg-white/80 border-white/20">
          <CardContent className="p-6">
            <NumericKeypad
              value={userAnswer}
              onChange={handleAnswerChange}
              onSubmit={handleSubmit}
              disabled={submitting}
              maxLength={3}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
