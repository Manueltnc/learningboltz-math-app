import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MultiplicationProblem } from '@/components/ui/MultiplicationDisplay'
import { useGridProgress } from '@/hooks/useGridProgress'
import { Trophy, Target, Clock, BarChart3, HelpCircle } from 'lucide-react'
import type { MathGridCell } from '@/types'

interface ProgressGridProps {
  email: string
  gradeLevel: string
}

export function ProgressGrid({ email, gradeLevel }: ProgressGridProps) {
  const { progress, loading, error, fetchProgress, getCellColor, getStudentCellState, getMasteryPercentage, getGuardrailMasteryPercentage } = useGridProgress()
  const [selectedCell, setSelectedCell] = useState<MathGridCell | null>(null)

  useEffect(() => {
    fetchProgress(email, gradeLevel)
  }, [email, gradeLevel, fetchProgress])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your progress...</p>
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
            <Button onClick={() => fetchProgress(email, gradeLevel)} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No progress data found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCellClick = (cell: MathGridCell) => {
    setSelectedCell(cell)
  }

  const getGuardrailRange = () => {
    switch (progress.currentGuardrail) {
      case '1-5': return 5
      case '1-9': return 9
      case '1-12': return 12
      default: return 12
    }
  }

  const guardrailRange = getGuardrailRange()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Stats */}
        <div className="mb-6">
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary text-center">
                Your Progress Grid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-muted-foreground">Overall Mastery</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{getMasteryPercentage()}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">Guardrail Mastery</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{getGuardrailMasteryPercentage()}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-muted-foreground">Total Correct</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{progress.totalCorrectAnswers}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium text-muted-foreground">Total Attempts</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{progress.totalAttempts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Grid */}
        <div className="mb-6">
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-center flex items-center justify-center gap-2">
                Multiplication Grid ({progress.currentGuardrail})
                <div className="group relative">
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Click on any cell to see details
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  {/* Header row */}
                  <div className="flex gap-1 mb-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0"></div>
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-center text-sm font-medium text-muted-foreground flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  
                  {/* Grid rows */}
                  {Array.from({ length: 12 }, (_, row) => (
                    <div key={row} className="flex gap-1 mb-1">
                      {/* Row header */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-center text-sm font-medium text-muted-foreground flex items-center justify-center flex-shrink-0">
                        {row + 1}
                      </div>
                      
                      {/* Grid cells */}
                      {Array.from({ length: 12 }, (_, col) => {
                        const cell = progress.gridState[row][col]
                        const isOutsideGuardrail = row >= guardrailRange || col >= guardrailRange
                        const isSelected = selectedCell === cell
                        
                        const cellState = getStudentCellState(cell)
                        const cellIcon = cellState === 'mastered' ? '✓' : 
                                        cellState === 'recently-failed' ? '!' : 
                                        '•'
                        
                        return (
                          <button
                            key={col}
                            onClick={() => handleCellClick(cell)}
                            className={`
                              w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl border-3 transition-all duration-300 flex items-center justify-center flex-shrink-0
                              ${isOutsideGuardrail 
                                ? 'bg-gray-200 border-gray-300 cursor-not-allowed' 
                                : `${getCellColor(cell)} border-white/60 hover:border-white/90 cursor-pointer hover:scale-110 hover:shadow-lg`
                              }
                              ${isSelected ? 'ring-3 ring-primary ring-offset-3 shadow-xl' : ''}
                            `}
                            disabled={isOutsideGuardrail}
                            aria-label={`${row + 1} times ${col + 1}. ${isOutsideGuardrail ? 'Not available in current level' : 
                              cellState === 'mastered' ? 'Mastered!' : 
                              cellState === 'recently-failed' ? 'Try again' : 
                              'Keep practicing'}`}
                            title={`${row + 1} × ${col + 1}`}
                          >
                            <MultiplicationProblem
                              multiplicand={row + 1}
                              multiplier={col + 1}
                              size="xs"
                              className="text-white"
                            />
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <div className="mb-6">
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-center">What the colors mean</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="w-8 h-8 bg-gray-400 rounded-xl border-2 border-white/60 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">•</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900">Keep going</span>
                    <p className="text-xs text-gray-600">Practice more to master this!</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <div className="w-8 h-8 bg-orange-400 rounded-xl border-2 border-white/60 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">!</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900">Try again</span>
                    <p className="text-xs text-gray-600">You got this wrong recently</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="w-8 h-8 bg-green-500 rounded-xl border-2 border-white/60 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">✓</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900">Mastered</span>
                    <p className="text-xs text-gray-600">Awesome! You know this!</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Cell Details */}
        {selectedCell && (
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center text-primary">
                {selectedCell.multiplicand} × {selectedCell.multiplier} = {selectedCell.multiplicand * selectedCell.multiplier}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-muted-foreground mb-2">How you're doing</p>
                  <p className="text-2xl font-bold text-primary">
                    {getStudentCellState(selectedCell) === 'mastered' ? '🎉 Mastered!' : 
                     getStudentCellState(selectedCell) === 'recently-failed' ? '🔄 Try again' : 
                     '📚 Keep practicing'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedCell.consecutiveCorrect >= 3 ? 'You know this really well!' : 
                     selectedCell.consecutiveCorrect > 0 ? `You've gotten it right ${selectedCell.consecutiveCorrect} time${selectedCell.consecutiveCorrect > 1 ? 's' : ''} in a row` :
                     'Start practicing this one!'}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-sm text-muted-foreground mb-2">Times practiced</p>
                  <p className="text-2xl font-bold text-primary">{selectedCell.attempts}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedCell.attempts > 0 ? 'Great job practicing!' : 'No practice yet'}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <p className="text-sm text-muted-foreground mb-2">Your speed</p>
                  <p className="text-2xl font-bold text-primary">{selectedCell.averageTimeSeconds.toFixed(1)}s</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedCell.lastAttemptTimeClassification === 'fast' ? '⚡ Super fast!' : 
                     selectedCell.lastAttemptTimeClassification === 'medium' ? '⏱️ Good speed' : '🐌 Take your time'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
