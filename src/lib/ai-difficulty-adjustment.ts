import type { MathGridCell, MathProblem } from '@/types'

export interface DifficultyAnalysis {
  strugglingAreas: string[]
  recommendedAdjustments: string[]
  confidenceLevel: 'low' | 'medium' | 'high'
  suggestedGuardrail?: '1-5' | '1-9' | '1-12'
}

export interface StudentPerformanceData {
  gridState: MathGridCell[][]
  recentSessions: {
    averageTime: number
    accuracy: number
    fastAnswers: number
    slowAnswers: number
  }[]
  currentGuardrail: '1-5' | '1-9' | '1-12'
}

/**
 * AI-powered difficulty adjustment system
 * Analyzes student performance and suggests appropriate interventions
 */
export class AIDifficultyAdjustment {
  
  /**
   * Analyze student performance and suggest difficulty adjustments
   */
  static analyzeStudentPerformance(data: StudentPerformanceData): DifficultyAnalysis {
    const strugglingAreas: string[] = []
    const recommendedAdjustments: string[] = []
    let confidenceLevel: 'low' | 'medium' | 'high' = 'medium'

    // Analyze grid performance
    const gridAnalysis = this.analyzeGridPerformance(data.gridState, data.currentGuardrail)
    strugglingAreas.push(...gridAnalysis.strugglingAreas)

    // Analyze time performance
    const timeAnalysis = this.analyzeTimePerformance(data.recentSessions)
    strugglingAreas.push(...timeAnalysis.strugglingAreas)

    // Analyze accuracy trends
    const accuracyAnalysis = this.analyzeAccuracyTrends(data.recentSessions)
    strugglingAreas.push(...accuracyAnalysis.strugglingAreas)

    // Generate recommendations
    if (gridAnalysis.shouldLowerGuardrail) {
      recommendedAdjustments.push('Consider lowering guardrail level to focus on basics')
      confidenceLevel = 'high'
    }

    if (timeAnalysis.needsTimeFocus) {
      recommendedAdjustments.push('Student needs more time to process problems - consider extending time limits')
    }

    if (accuracyAnalysis.needsReview) {
      recommendedAdjustments.push('Review fundamental concepts before proceeding')
    }

    // Determine suggested guardrail
    let suggestedGuardrail: '1-5' | '1-9' | '1-12' | undefined
    if (gridAnalysis.shouldLowerGuardrail) {
      if (data.currentGuardrail === '1-12') {
        suggestedGuardrail = '1-9'
      } else if (data.currentGuardrail === '1-9') {
        suggestedGuardrail = '1-5'
      }
    }

    return {
      strugglingAreas,
      recommendedAdjustments,
      confidenceLevel,
      suggestedGuardrail
    }
  }

  /**
   * Analyze grid performance to identify struggling areas
   */
  private static analyzeGridPerformance(
    gridState: MathGridCell[][], 
    currentGuardrail: '1-5' | '1-9' | '1-12'
  ): { strugglingAreas: string[], shouldLowerGuardrail: boolean } {
    const strugglingAreas: string[] = []
    let shouldLowerGuardrail = false

    const guardrailRange = currentGuardrail === '1-5' ? 5 : 
                          currentGuardrail === '1-9' ? 9 : 12

    // Analyze within current guardrail
    let totalProblems = 0
    let masteredProblems = 0
    let slowProblems = 0

    for (let row = 0; row < guardrailRange; row++) {
      for (let col = 0; col < guardrailRange; col++) {
        const cell = gridState[row][col]
        totalProblems++

        if (cell.consecutiveCorrect >= 3) {
          masteredProblems++
        }

        if (cell.averageTimeSeconds > 15) {
          slowProblems++
        }

        // Identify specific struggling patterns
        if (cell.attempts > 5 && cell.consecutiveCorrect < 2) {
          strugglingAreas.push(`${row + 1} × ${col + 1} multiplication`)
        }
      }
    }

    const masteryRate = masteredProblems / totalProblems
    const slowRate = slowProblems / totalProblems

    if (masteryRate < 0.3) {
      strugglingAreas.push('Low overall mastery rate')
      shouldLowerGuardrail = true
    }

    if (slowRate > 0.5) {
      strugglingAreas.push('Many problems taking too long')
    }

    return { strugglingAreas, shouldLowerGuardrail }
  }

  /**
   * Analyze time performance across recent sessions
   */
  private static analyzeTimePerformance(sessions: StudentPerformanceData['recentSessions']): {
    strugglingAreas: string[], needsTimeFocus: boolean
  } {
    const strugglingAreas: string[] = []
    let needsTimeFocus = false

    if (sessions.length === 0) return { strugglingAreas, needsTimeFocus }

    const avgTime = sessions.reduce((sum, s) => sum + s.averageTime, 0) / sessions.length
    const avgSlowAnswers = sessions.reduce((sum, s) => sum + s.slowAnswers, 0) / sessions.length
    const avgFastAnswers = sessions.reduce((sum, s) => sum + s.fastAnswers, 0) / sessions.length

    if (avgTime > 20) {
      strugglingAreas.push('Average response time is too high')
      needsTimeFocus = true
    }

    if (avgSlowAnswers > avgFastAnswers * 2) {
      strugglingAreas.push('Too many slow responses compared to fast ones')
    }

    return { strugglingAreas, needsTimeFocus }
  }

  /**
   * Analyze accuracy trends
   */
  private static analyzeAccuracyTrends(sessions: StudentPerformanceData['recentSessions']): {
    strugglingAreas: string[], needsReview: boolean
  } {
    const strugglingAreas: string[] = []
    let needsReview = false

    if (sessions.length < 2) return { strugglingAreas, needsReview }

    const recentAccuracy = sessions[sessions.length - 1].accuracy
    const previousAccuracy = sessions[sessions.length - 2].accuracy

    if (recentAccuracy < 70) {
      strugglingAreas.push('Low accuracy rate')
      needsReview = true
    }

    if (recentAccuracy < previousAccuracy - 10) {
      strugglingAreas.push('Declining accuracy trend')
      needsReview = true
    }

    return { strugglingAreas, needsReview }
  }

  /**
   * Generate personalized practice problems based on struggling areas
   */
  static generatePersonalizedProblems(
    strugglingAreas: string[], 
    currentGuardrail: '1-5' | '1-9' | '1-12'
  ): MathProblem[] {
    const problems: MathProblem[] = []
    
    // Parse struggling areas to extract specific multiplication facts
    const strugglingFacts = strugglingAreas
      .filter(area => area.includes('×'))
      .map(area => {
        const match = area.match(/(\d+) × (\d+)/)
        if (match) {
          return {
            multiplicand: parseInt(match[1]),
            multiplier: parseInt(match[2])
          }
        }
        return null
      })
      .filter(Boolean)

    // Generate problems for struggling facts
    strugglingFacts.forEach(fact => {
      if (fact) {
        problems.push({
          id: `personalized-${fact.multiplicand}-${fact.multiplier}`,
          multiplicand: fact.multiplicand,
          multiplier: fact.multiplier,
          answer: fact.multiplicand * fact.multiplier,
          difficulty: this.getDifficultyLevel(fact.multiplicand, fact.multiplier)
        })
      }
    })

    // If no specific facts, generate problems within guardrail
    if (problems.length === 0) {
      const guardrailRange = currentGuardrail === '1-5' ? 5 : 
                            currentGuardrail === '1-9' ? 9 : 12
      
      for (let i = 0; i < 10; i++) {
        const multiplicand = Math.floor(Math.random() * guardrailRange) + 1
        const multiplier = Math.floor(Math.random() * guardrailRange) + 1
        
        problems.push({
          id: `personalized-${i}`,
          multiplicand,
          multiplier,
          answer: multiplicand * multiplier,
          difficulty: this.getDifficultyLevel(multiplicand, multiplier)
        })
      }
    }

    return problems
  }

  private static getDifficultyLevel(multiplicand: number, multiplier: number): 'basic' | 'intermediate' | 'advanced' {
    if (multiplicand <= 5 && multiplier <= 5) return 'basic'
    if (multiplicand <= 9 && multiplier <= 9) return 'intermediate'
    return 'advanced'
  }
}
