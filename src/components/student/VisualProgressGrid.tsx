import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MultiplicationProblem } from '@/components/ui/MultiplicationDisplay'
import { useGridProgress } from '@/hooks/useGridProgress'
import { X, Maximize2 } from 'lucide-react'
import type { MathGridCell } from '@/types'

interface VisualProgressGridProps {
  email: string
  gradeLevel: string
  isModal?: boolean
  onClose?: () => void
  showTitle?: boolean
  compact?: boolean
}

export function VisualProgressGrid({ 
  email, 
  gradeLevel, 
  isModal = false, 
  onClose, 
  showTitle = true,
  compact = false 
}: VisualProgressGridProps) {
  const { progress, loading, error, fetchProgress, getCellColor, getStudentCellState } = useGridProgress()
  const [selectedCell, setSelectedCell] = useState<MathGridCell | null>(null)

  // Fetch progress data when component mounts
  useEffect(() => {
    fetchProgress(email, gradeLevel)
  }, [email, gradeLevel, fetchProgress])

  const getGuardrailRange = () => {
    if (!progress) return 12
    switch (progress.currentGuardrail) {
      case '1-5': return 5
      case '1-9': return 9
      case '1-12': return 12
      default: return 12
    }
  }

  const guardrailRange = getGuardrailRange()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading progress...</p>
        </div>
      </div>
    )
  }

  if (error || !progress) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Unable to load progress</p>
      </div>
    )
  }

  const cellSize = compact ? 'w-8 h-8' : 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16'
  const textSize = compact ? 'text-xs' : 'text-sm'

  return (
    <div className={`${isModal ? 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' : ''}`}>
      <Card className={`backdrop-blur-sm bg-white/90 border-white/20 ${isModal ? 'max-w-4xl w-full max-h-[90vh] overflow-y-auto' : ''}`}>
        {showTitle && (
          <CardHeader className="relative">
            <CardTitle className="text-lg font-semibold text-center">
              Multiplication Progress Grid ({progress.currentGuardrail})
            </CardTitle>
            {isModal && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute right-4 top-4 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
        )}
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header row */}
              <div className="flex gap-1 mb-1">
                <div className={`${cellSize} flex-shrink-0`}></div>
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className={`${cellSize} text-center ${textSize} font-medium text-muted-foreground flex items-center justify-center flex-shrink-0`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              
              {/* Grid rows */}
              {Array.from({ length: 12 }, (_, row) => (
                <div key={row} className="flex gap-1 mb-1">
                  {/* Row header */}
                  <div className={`${cellSize} text-center ${textSize} font-medium text-muted-foreground flex items-center justify-center flex-shrink-0`}>
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
                        onClick={() => setSelectedCell(cell)}
                        className={`
                          ${cellSize} rounded-xl border-3 transition-all duration-300 flex items-center justify-center flex-shrink-0
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
                          size={compact ? "xs" : "xs"}
                          className="text-white"
                        />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          {!compact && (
            <div className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="w-6 h-6 bg-gray-400 rounded-xl border-2 border-white/60 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">•</span>
                  </div>
                  <span className="text-xs text-gray-900">Keep going</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-200">
                  <div className="w-6 h-6 bg-orange-400 rounded-xl border-2 border-white/60 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">!</span>
                  </div>
                  <span className="text-xs text-gray-900">Try again</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                  <div className="w-6 h-6 bg-green-500 rounded-xl border-2 border-white/60 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">✓</span>
                  </div>
                  <span className="text-xs text-gray-900">Mastered</span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Cell Details */}
          {selectedCell && !compact && (
            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <h4 className="font-semibold text-center text-primary mb-3">
                {selectedCell.multiplicand} × {selectedCell.multiplier} = {selectedCell.multiplicand * selectedCell.multiplier}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">How you're doing</p>
                  <p className="text-lg font-bold text-primary">
                    {getStudentCellState(selectedCell) === 'mastered' ? '🎉 Mastered!' : 
                     getStudentCellState(selectedCell) === 'recently-failed' ? '🔄 Try again' : 
                     '📚 Keep practicing'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your speed</p>
                  <p className="text-lg font-bold text-primary">{selectedCell.averageTimeSeconds.toFixed(1)}s</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Thumbnail version for showing in other parts of the app
export function ProgressGridThumbnail({ email, gradeLevel, onOpenModal }: { 
  email: string
  gradeLevel: string
  onOpenModal: () => void 
}) {
  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20 cursor-pointer hover:shadow-lg transition-shadow" onClick={onOpenModal}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-center flex items-center justify-center gap-2">
          Progress Grid
          <Maximize2 className="h-3 w-3 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <VisualProgressGrid 
          email={email} 
          gradeLevel={gradeLevel} 
          showTitle={false} 
          compact={true}
        />
      </CardContent>
    </Card>
  )
}
