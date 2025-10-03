import { describe, it, expect } from 'vitest'
import type { MathGridCell } from '@/types'

// Mock the getStudentCellState function logic for testing
function getStudentCellState(cell: MathGridCell): 'mastered' | 'recently-failed' | 'not-mastered' {
  if (cell.isLocked) return 'not-mastered'
  if (cell.consecutiveCorrect >= 3) return 'mastered'
  if (!cell.lastAttemptCorrect) return 'recently-failed'
  return 'not-mastered'
}

function getCellColor(cell: MathGridCell): string {
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
}

describe('Grid Coloring Logic', () => {
  it('should show green for mastered cells (3+ consecutive correct)', () => {
    const cell: MathGridCell = {
      multiplicand: 7,
      multiplier: 8,
      consecutiveCorrect: 3,
      lastAttemptCorrect: true,
      attempts: 5,
      isLocked: false,
      averageTimeSeconds: 2.5,
      totalTimeSpent: 12.5,
      lastAttemptTimeClassification: 'fast',
      masteryAchievedAt: new Date()
    }

    expect(getStudentCellState(cell)).toBe('mastered')
    expect(getCellColor(cell)).toBe('bg-green-500')
  })

  it('should show orange for recently failed cells', () => {
    const cell: MathGridCell = {
      multiplicand: 6,
      multiplier: 7,
      consecutiveCorrect: 1,
      lastAttemptCorrect: false, // Recently failed
      attempts: 3,
      isLocked: false,
      averageTimeSeconds: 4.2,
      totalTimeSpent: 12.6,
      lastAttemptTimeClassification: 'medium',
      masteryAchievedAt: null
    }

    expect(getStudentCellState(cell)).toBe('recently-failed')
    expect(getCellColor(cell)).toBe('bg-orange-400')
  })

  it('should show grey for not mastered cells', () => {
    const cell: MathGridCell = {
      multiplicand: 4,
      multiplier: 5,
      consecutiveCorrect: 1,
      lastAttemptCorrect: true, // Last attempt was correct but not mastered
      attempts: 2,
      isLocked: false,
      averageTimeSeconds: 3.1,
      totalTimeSpent: 6.2,
      lastAttemptTimeClassification: 'fast',
      masteryAchievedAt: null
    }

    expect(getStudentCellState(cell)).toBe('not-mastered')
    expect(getCellColor(cell)).toBe('bg-gray-400')
  })

  it('should show grey for locked cells', () => {
    const cell: MathGridCell = {
      multiplicand: 11,
      multiplier: 12,
      consecutiveCorrect: 0,
      lastAttemptCorrect: false,
      attempts: 0,
      isLocked: true, // Locked (outside guardrail)
      averageTimeSeconds: 0,
      totalTimeSpent: 0,
      lastAttemptTimeClassification: 'fast',
      masteryAchievedAt: null
    }

    expect(getStudentCellState(cell)).toBe('not-mastered')
    expect(getCellColor(cell)).toBe('bg-gray-400')
  })

  it('should prioritize mastery over recent failure', () => {
    const cell: MathGridCell = {
      multiplicand: 8,
      multiplier: 9,
      consecutiveCorrect: 3, // Mastered
      lastAttemptCorrect: false, // But last attempt was wrong (shouldn't matter)
      attempts: 10,
      isLocked: false,
      averageTimeSeconds: 2.8,
      totalTimeSpent: 28,
      lastAttemptTimeClassification: 'slow',
      masteryAchievedAt: new Date()
    }

    expect(getStudentCellState(cell)).toBe('mastered')
    expect(getCellColor(cell)).toBe('bg-green-500')
  })
})


