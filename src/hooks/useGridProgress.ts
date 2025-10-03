import { useState, useCallback } from 'react'
import { createApiClient } from '@/lib/api-client'
import type { MathProgress, MathGridCell } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiClient = createApiClient(supabaseUrl, supabaseKey)

export function useGridProgress() {
  const [progress, setProgress] = useState<MathProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async (email: string, gradeLevel: string) => {
    setLoading(true)
    setError(null)

    try {
      const mathProgress = await apiClient.getMathProgress(email, gradeLevel)
      setProgress(mathProgress)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateGrid = useCallback(async (studentId: string, gridUpdates: MathGridCell[]) => {
    try {
      await apiClient.updateMathGrid(studentId, gridUpdates)
      
      // Update local state
      if (progress) {
        const updatedGrid = progress.gridState.map(row => [...row])
        
        gridUpdates.forEach(update => {
          const row = update.multiplicand - 1
          const col = update.multiplier - 1
          if (row >= 0 && row < updatedGrid.length && col >= 0 && col < updatedGrid[row].length) {
            updatedGrid[row][col] = { ...updatedGrid[row][col], ...update }
          }
        })

        setProgress({
          ...progress,
          gridState: updatedGrid,
          totalCorrectAnswers: progress.totalCorrectAnswers + gridUpdates.filter(u => u.lastAttemptCorrect).length,
          totalAttempts: progress.totalAttempts + gridUpdates.length
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update grid')
    }
  }, [progress])

  const setGuardrail = useCallback(async (studentId: string, guardrail: '1-5' | '1-9' | '1-12') => {
    try {
      await apiClient.setMathGuardrail(studentId, guardrail)
      
      if (progress) {
        setProgress({
          ...progress,
          currentGuardrail: guardrail
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set guardrail')
    }
  }, [progress])

  // Helper function to determine student-facing cell state
  const getStudentCellState = useCallback((cell: MathGridCell): 'mastered' | 'recently-failed' | 'not-mastered' => {
    if (cell.isLocked) return 'not-mastered'
    if (cell.consecutiveCorrect >= 3) return 'mastered'
    if (!cell.lastAttemptCorrect) return 'recently-failed'
    return 'not-mastered'
  }, [])

  const getCellColor = useCallback((cell: MathGridCell) => {
    const state = getStudentCellState(cell)
    switch (state) {
      case 'mastered':
        return 'bg-green-500'
      case 'recently-failed':
        return 'bg-orange-400'
      case 'not-mastered':
      default:
        return 'bg-gray-400'
    }
  }, [getStudentCellState])

  const getMasteryPercentage = useCallback(() => {
    if (!progress) return 0

    const totalCells = progress.gridState.flat().length
    const masteredCells = progress.gridState.flat().filter(cell => cell.consecutiveCorrect >= 3).length
    
    return Math.round((masteredCells / totalCells) * 100)
  }, [progress])

  const getGuardrailMasteryPercentage = useCallback(() => {
    if (!progress) return 0

    const guardrailRange = progress.currentGuardrail === '1-5' ? 5 : 
                          progress.currentGuardrail === '1-9' ? 9 : 12

    const relevantCells = progress.gridState
      .slice(0, guardrailRange)
      .map(row => row.slice(0, guardrailRange))
      .flat()
    
    const masteredCells = relevantCells.filter(cell => cell.consecutiveCorrect >= 3).length
    
    return Math.round((masteredCells / relevantCells.length) * 100)
  }, [progress])

  return {
    progress,
    loading,
    error,
    fetchProgress,
    updateGrid,
    setGuardrail,
    getCellColor,
    getStudentCellState,
    getMasteryPercentage,
    getGuardrailMasteryPercentage,
  }
}
