/**
 * Analytics utility functions for testing and validation
 */

export function getDifficultyBand(multiplicand: number, multiplier: number): 'basic' | 'intermediate' | 'advanced' {
  const maxValue = Math.max(multiplicand, multiplier)
  
  if (maxValue <= 5) {
    return 'basic'
  } else if (maxValue <= 9) {
    return 'intermediate'
  } else {
    return 'advanced'
  }
}

export function getTimeClassification(
  timeSpentSeconds: number, 
  config: { fastThreshold: number; mediumThreshold: number }
): 'fast' | 'medium' | 'slow' {
  if (timeSpentSeconds < config.fastThreshold) {
    return 'fast'
  } else if (timeSpentSeconds <= config.mediumThreshold) {
    return 'medium'
  } else {
    return 'slow'
  }
}

export function getEasternTimeDate(date: Date): string {
  // Convert to Eastern Time and return YYYY-MM-DD format
  const etDate = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }))
  return etDate.toISOString().split('T')[0]
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

export function calculateAverageTime(totalTime: number, totalAttempts: number): number {
  if (totalAttempts === 0) return 0
  return Math.round((totalTime / totalAttempts) * 100) / 100
}

// Test data generators
export function generateMockQuestionAttempts(count: number) {
  const attempts = []
  const multiplicands = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const multipliers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  
  for (let i = 0; i < count; i++) {
    const multiplicand = multiplicands[Math.floor(Math.random() * multiplicands.length)]
    const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)]
    const correctAnswer = multiplicand * multiplier
    const isCorrect = Math.random() > 0.3 // 70% accuracy
    const userAnswer = isCorrect ? correctAnswer : correctAnswer + Math.floor(Math.random() * 10) - 5
    const timeSpent = Math.random() * 30 + 2 // 2-32 seconds
    
    attempts.push({
      id: `attempt-${i}`,
      sessionId: `session-${Math.floor(i / 10)}`,
      studentId: `student-${Math.floor(Math.random() * 5)}`,
      multiplicand,
      multiplier,
      userAnswer,
      correctAnswer,
      isCorrect,
      timeSpentSeconds: timeSpent,
      timeClassification: getTimeClassification(timeSpent, { fastThreshold: 5, mediumThreshold: 15 }),
      attemptNumber: i + 1,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
    })
  }
  
  return attempts
}

export function generateMockDailyMetrics(days: number) {
  const metrics = []
  const baseDate = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000)
    const attempted = Math.floor(Math.random() * 50) + 10
    const correct = Math.floor(attempted * (0.6 + Math.random() * 0.3)) // 60-90% accuracy
    const totalTime = attempted * (5 + Math.random() * 15) // 5-20 seconds average
    
    metrics.push({
      id: `metric-${i}`,
      studentId: `student-${Math.floor(Math.random() * 5)}`,
      metricDate: getEasternTimeDate(date),
      appType: 'math',
      attempted,
      correct,
      avgTimeSeconds: totalTime / attempted,
      fastCount: Math.floor(attempted * 0.3),
      mediumCount: Math.floor(attempted * 0.5),
      slowCount: Math.floor(attempted * 0.2),
      timeSpentSeconds: totalTime,
      createdAt: date,
      updatedAt: date
    })
  }
  
  return metrics
}
