// Configuration for Math Times Tables App

export const PLACEMENT_CONFIG = {
  // Questions per grade level
  questionsByGrade: {
    '1': 20,
    '2': 20,
    '3': 20,
    '4': 20,
    '5': 20,
    default: 20
  },
  // Distribution: 90% from 1-9, 10% from 9-12
  distribution: {
    basic: 0.9,  // 1-9 range
    advanced: 0.1 // 9-12 range
  }
}

export const PRACTICE_CONFIG = {
  sessionDuration: 10 * 60, // 10 minutes in seconds
  masteryThreshold: 3 // Need 3 correct answers to master a problem
}

export const TIME_CLASSIFICATION = {
  fast: 5,    // < 5 seconds
  medium: 15  // 5-15 seconds (>15 is slow)
}

export const PROGRESS_GRID_CONFIG = {
  // How many days to consider a failure "recent" for orange highlighting
  recentFailureWindowDays: 7
}

// Helper function to get placement question count for a grade
export function getPlacementQuestionCount(gradeLevel: string): number {
  return PLACEMENT_CONFIG.questionsByGrade[gradeLevel as keyof typeof PLACEMENT_CONFIG.questionsByGrade] || 
         PLACEMENT_CONFIG.questionsByGrade.default
}

// Helper function to classify time
export function classifyTime(seconds: number): 'fast' | 'medium' | 'slow' {
  if (seconds < TIME_CLASSIFICATION.fast) return 'fast'
  if (seconds <= TIME_CLASSIFICATION.medium) return 'medium'
  return 'slow'
}
