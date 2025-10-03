// Shared type definitions for Math Times Tables App

export interface MathProblem {
  id: string
  multiplicand: number
  multiplier: number
  answer: number
  difficulty: 'basic' | 'intermediate' | 'advanced'
}

export interface MathGridCell {
  multiplicand: number
  multiplier: number
  consecutiveCorrect: number
  lastAttemptCorrect: boolean
  attempts: number
  isLocked: boolean
  averageTimeSeconds: number
  totalTimeSpent?: number
  lastAttemptTimeClassification?: 'fast' | 'medium' | 'slow'
  masteryAchievedAt?: Date
}

export interface MathSessionState {
  sessionId: string
  sessionType: 'placement' | 'practice'
  currentProblemIndex: number
  problemQueue: MathProblem[]
  incorrectProblems: MathProblem[]
  gridUpdates: MathGridCell[]
}

export interface MathProgress {
  studentId: string
  gridState: MathGridCell[][]
  currentGuardrail: '1-5' | '1-9' | '1-12'
  totalCorrectAnswers: number
  totalAttempts: number
  lastUpdated: Date
}

export interface Student {
  id: string
  email: string
  displayName: string
  gradeLevel: string
  createdAt: Date
  updatedAt: Date
}

export interface StudentProgress {
  studentId: string
  appType: string
  totalSessions: number
  totalItemsAttempted: number
  totalCorrectAnswers: number
  overallAccuracy: number
  averageSessionTime: number
}

export interface StudentSummary {
  id: string
  email: string
  displayName: string
  gradeLevel: string
  currentGuardrail: string
  totalAttempts: number
  accuracy: number
  avgTimePerQuestion: number
  masteryPercentage: number
  lastActive: string
}

export interface TimeBucketConfig {
  fastThreshold: number
  mediumThreshold: number
}

export interface DailyStudentMetrics {
  id: string
  studentId: string
  metricDate: string
  appType: string
  attempted: number
  correct: number
  avgTimeSeconds: number
  fastCount: number
  mediumCount: number
  slowCount: number
  timeSpentSeconds: number
  createdAt: Date
  updatedAt: Date
}

export interface DailyDifficultyMetrics {
  id: string
  studentId: string
  metricDate: string
  appType: string
  difficultyBand: 'basic' | 'intermediate' | 'advanced'
  attempted: number
  correct: number
  avgTimeSeconds: number
  timeSpentSeconds: number
  createdAt: Date
  updatedAt: Date
}

export interface CohortMetrics {
  totalStudents: number
  totalAttempts: number
  averageAccuracy: number
  averageTimePerQuestion: number
  difficultyBreakdown: {
    basic: { attempted: number; correct: number; avgTime: number }
    intermediate: { attempted: number; correct: number; avgTime: number }
    advanced: { attempted: number; correct: number; avgTime: number }
  }
}

