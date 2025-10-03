import { useState, useCallback, useEffect } from 'react'
import { createApiClient } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'
import { getPlacementQuestionCount, PLACEMENT_CONFIG, classifyTime } from '@/lib/config'
import type { MathProblem, MathSessionState } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiClient = createApiClient(supabaseUrl, supabaseKey)

export function useMathSession() {
  const [sessionState, setSessionState] = useState<MathSessionState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-save session progress every 30 seconds
  const saveSessionProgress = useCallback(async () => {
    if (!sessionState) return

    try {
      await apiClient.updateSession(sessionState.sessionId, {
        itemsAttempted: sessionState.currentProblemIndex,
        itemsCorrect: sessionState.gridUpdates.filter(g => g.lastAttemptCorrect).length,
        accuracy: calculateAccuracy(
          sessionState.gridUpdates.filter(g => g.lastAttemptCorrect).length,
          sessionState.currentProblemIndex
        ),
        duration: 0, // Will be calculated from actual session time
        averageTimePerQuestion: sessionState.gridUpdates.length > 0 ? 
          sessionState.gridUpdates.reduce((sum, g) => sum + g.averageTimeSeconds, 0) / sessionState.gridUpdates.length : 0,
        fastAnswersCount: sessionState.gridUpdates.filter(g => g.lastAttemptTimeClassification === 'fast').length,
        mediumAnswersCount: sessionState.gridUpdates.filter(g => g.lastAttemptTimeClassification === 'medium').length,
        slowAnswersCount: sessionState.gridUpdates.filter(g => g.lastAttemptTimeClassification === 'slow').length
      })
    } catch (err) {
      console.error('Failed to save session progress:', err)
    }
  }, [sessionState])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!sessionState) return

    const interval = setInterval(() => {
      saveSessionProgress()
    }, 30000) // Save every 30 seconds

    return () => clearInterval(interval)
  }, [sessionState, saveSessionProgress])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionState) {
        // Mark session as abandoned
        apiClient.updateSession(sessionState.sessionId, {
          itemsAttempted: sessionState.currentProblemIndex,
          itemsCorrect: sessionState.gridUpdates.filter(g => g.lastAttemptCorrect).length,
          accuracy: calculateAccuracy(
            sessionState.gridUpdates.filter(g => g.lastAttemptCorrect).length,
            sessionState.currentProblemIndex
          ),
          duration: 0,
          averageTimePerQuestion: 0,
          fastAnswersCount: 0,
          mediumAnswersCount: 0,
          slowAnswersCount: 0
        }).catch(console.error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [sessionState])

  // Check for active sessions on mount
  const checkForActiveSessions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: activeSessions, error } = await supabase
        .rpc('get_active_sessions_for_student', { student_uuid: user.id })

      if (error) throw error
      return activeSessions
    } catch (err) {
      console.error('Failed to check for active sessions:', err)
      return null
    }
  }, [])

  const startPlacementTest = useCallback(async (email: string, gradeLevel: string) => {
    setLoading(true)
    setError(null)

    try {
      // Get question count from config
      const totalQuestions = getPlacementQuestionCount(gradeLevel)
      const basicCount = Math.floor(totalQuestions * PLACEMENT_CONFIG.distribution.basic)
      const advancedCount = totalQuestions - basicCount
      
      // Generate placement test problems (90% from 1-9, 10% from 9-12)
      const problems1to9 = generateMathProblems([1, 9], [1, 9], basicCount)
      const problems9to12 = generateMathProblems([9, 12], [9, 12], advancedCount)
      const allProblems = [...problems1to9, ...problems9to12]
      
      // Shuffle the problems
      const shuffledProblems = allProblems.sort(() => Math.random() - 0.5)

      const { sessionId } = await apiClient.createSession(
        'math',
        email,
        gradeLevel,
        { sessionType: 'placement', problems: shuffledProblems }
      )

      setSessionState({
        sessionId,
        sessionType: 'placement',
        currentProblemIndex: 0,
        problemQueue: shuffledProblems,
        incorrectProblems: [],
        gridUpdates: []
      })

      return { sessionId, problems: shuffledProblems }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start placement test')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const startPracticeSession = useCallback(async (email: string, gradeLevel: string) => {
    setLoading(true)
    setError(null)

    try {
      // Get student's math progress to determine which problems to practice
      const mathProgress = await apiClient.getMathProgress(email, gradeLevel)
      
      // Group unmastered problems by difficulty band
      const problemsByDifficulty: {
        basic: MathProblem[]
        intermediate: MathProblem[]
        advanced: MathProblem[]
      } = {
        basic: [],
        intermediate: [],
        advanced: []
      }

      for (let row = 0; row < mathProgress.gridState.length; row++) {
        for (let col = 0; col < mathProgress.gridState[row].length; col++) {
          const cell = mathProgress.gridState[row][col]
          if (!cell.isLocked && cell.consecutiveCorrect < 3) {
            const problem: MathProblem = {
              id: `problem-${cell.multiplicand}-${cell.multiplier}`,
              multiplicand: cell.multiplicand,
              multiplier: cell.multiplier,
              answer: cell.multiplicand * cell.multiplier,
              difficulty: getDifficultyBand(cell.multiplicand, cell.multiplier)
            }

            // Add to appropriate difficulty band
            problemsByDifficulty[problem.difficulty].push(problem)
          }
        }
      }

      // Create adaptive problem queue
      // Start with easier problems (basic), include some intermediate, fewer advanced
      const adaptiveProblemQueue: MathProblem[] = []

      // Shuffle each difficulty band to ensure variety
      const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      }

      const shuffledBasic = shuffleArray(problemsByDifficulty.basic)
      const shuffledIntermediate = shuffleArray(problemsByDifficulty.intermediate)
      const shuffledAdvanced = shuffleArray(problemsByDifficulty.advanced)

      // Adaptive distribution: 50% basic, 35% intermediate, 15% advanced (or based on availability)
      const totalProblems = Math.min(30, shuffledBasic.length + shuffledIntermediate.length + shuffledAdvanced.length)
      const basicCount = Math.min(Math.floor(totalProblems * 0.5), shuffledBasic.length)
      const intermediateCount = Math.min(Math.floor(totalProblems * 0.35), shuffledIntermediate.length)
      const advancedCount = Math.min(Math.floor(totalProblems * 0.15), shuffledAdvanced.length)

      // Add problems to queue
      adaptiveProblemQueue.push(...shuffledBasic.slice(0, basicCount))
      adaptiveProblemQueue.push(...shuffledIntermediate.slice(0, intermediateCount))
      adaptiveProblemQueue.push(...shuffledAdvanced.slice(0, advancedCount))

      // Final shuffle to mix difficulty levels during practice
      const finalProblemQueue = shuffleArray(adaptiveProblemQueue)

      const { sessionId } = await apiClient.createSession(
        'math',
        email,
        gradeLevel,
        { sessionType: 'practice', problems: finalProblemQueue }
      )

      setSessionState({
        sessionId,
        sessionType: 'practice',
        currentProblemIndex: 0,
        problemQueue: finalProblemQueue,
        incorrectProblems: [],
        gridUpdates: []
      })

      return { sessionId, problems: finalProblemQueue }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start practice session')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const submitAnswer = useCallback(async (answer: number, timeSpent: number) => {
    if (!sessionState) return { correct: false }

    // Get the current problem using the same logic as getCurrentProblem
    let currentProblem = null
    if (sessionState.sessionType === 'practice' && sessionState.incorrectProblems.length > 0) {
      currentProblem = sessionState.incorrectProblems[0]
    } else if (sessionState.currentProblemIndex < sessionState.problemQueue.length) {
      currentProblem = sessionState.problemQueue[sessionState.currentProblemIndex]
    }
    
    if (!currentProblem) {
      console.error('No current problem found', {
        sessionType: sessionState.sessionType,
        currentIndex: sessionState.currentProblemIndex,
        queueLength: sessionState.problemQueue.length,
        incorrectCount: sessionState.incorrectProblems.length
      })
      return { correct: false }
    }

    const isCorrect = answer === currentProblem.answer

    // Get current user for student ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Record detailed question attempt
    try {
      await apiClient.recordQuestionAttempt(
        sessionState.sessionId,
        user.id,
        currentProblem.multiplicand,
        currentProblem.multiplier,
        answer,
        currentProblem.answer,
        isCorrect,
        timeSpent,
        sessionState.currentProblemIndex + 1
      )
    } catch (err) {
      console.error('Failed to record question attempt:', err)
    }

    // Find existing grid update for this problem
    const existingUpdate = sessionState.gridUpdates.find(g => 
      g.multiplicand === currentProblem.multiplicand && 
      g.multiplier === currentProblem.multiplier
    )

    // Calculate new consecutive correct count
    const newConsecutiveCorrect = isCorrect ? 
      (existingUpdate?.consecutiveCorrect || 0) + 1 : 0

    // Calculate time classification using config
    const timeClassification = classifyTime(timeSpent)

    // Update grid progress with enhanced analytics
    const gridUpdate = {
      multiplicand: currentProblem.multiplicand,
      multiplier: currentProblem.multiplier,
      consecutiveCorrect: newConsecutiveCorrect,
      lastAttemptCorrect: isCorrect,
      attempts: (existingUpdate?.attempts || 0) + 1,
      isLocked: false,
      averageTimeSeconds: existingUpdate ? 
        (existingUpdate.averageTimeSeconds * existingUpdate.attempts + timeSpent) / (existingUpdate.attempts + 1) :
        timeSpent,
      totalTimeSpent: (existingUpdate?.totalTimeSpent || 0) + timeSpent,
      lastAttemptTimeClassification: timeClassification,
      masteryAchievedAt: newConsecutiveCorrect === 3 ? new Date() : existingUpdate?.masteryAchievedAt
    }

    const updatedGridUpdates = sessionState.gridUpdates.filter(g => 
      !(g.multiplicand === currentProblem.multiplicand && g.multiplier === currentProblem.multiplier)
    )
    updatedGridUpdates.push(gridUpdate)

    // Update session state
    setSessionState(prev => {
      if (!prev) return null

      // For practice sessions: add incorrect problems to retry queue
      // For placement tests: skip incorrect problems (don't re-queue)
      const newIncorrectProblems = (!isCorrect && prev.sessionType === 'practice') ? 
        [...prev.incorrectProblems, currentProblem] : 
        prev.incorrectProblems

      return {
        ...prev,
        // Don't increment index here - let getNextProblem handle it
        gridUpdates: updatedGridUpdates,
        incorrectProblems: newIncorrectProblems
      }
    })

    // Calculate session analytics
    const totalCorrect = updatedGridUpdates.filter(g => g.lastAttemptCorrect).length
    const totalAttempts = updatedGridUpdates.length
    const fastAnswers = updatedGridUpdates.filter(g => g.lastAttemptTimeClassification === 'fast').length
    const mediumAnswers = updatedGridUpdates.filter(g => g.lastAttemptTimeClassification === 'medium').length
    const slowAnswers = updatedGridUpdates.filter(g => g.lastAttemptTimeClassification === 'slow').length
    const averageTime = updatedGridUpdates.reduce((sum, g) => sum + g.averageTimeSeconds, 0) / updatedGridUpdates.length

    // Update session in database with enhanced analytics
    try {
      await apiClient.updateSession(sessionState.sessionId, {
        itemsAttempted: totalAttempts,
        itemsCorrect: totalCorrect,
        accuracy: calculateAccuracy(totalCorrect, totalAttempts),
        duration: timeSpent,
        averageTimePerQuestion: averageTime,
        fastAnswersCount: fastAnswers,
        mediumAnswersCount: mediumAnswers,
        slowAnswersCount: slowAnswers
      })
    } catch (err) {
      console.error('Failed to update session:', err)
    }

    return { correct: isCorrect }
  }, [sessionState])

  const getNextProblem = useCallback(() => {
    if (!sessionState) return null

    // For practice sessions: use sequential progression (don't prioritize incorrect problems)
    // This ensures we advance after any answer, including wrong ones
    if (sessionState.sessionType === 'practice') {
      const nextIndex = sessionState.currentProblemIndex
      if (nextIndex < sessionState.problemQueue.length) {
        return sessionState.problemQueue[nextIndex]
      }
      return null
    }

    // For placement tests: use sequential progression
    const nextIndex = sessionState.currentProblemIndex
    if (nextIndex < sessionState.problemQueue.length) {
      return sessionState.problemQueue[nextIndex]
    }

    return null
  }, [sessionState])

  const advanceToNextProblem = useCallback(() => {
    if (!sessionState) return

    // For both practice and placement sessions: advance the index
    // This ensures sequential progression through the problem queue
    setSessionState(prev => prev ? {
      ...prev,
      currentProblemIndex: prev.currentProblemIndex + 1
    } : null)
  }, [sessionState])

  const removeIncorrectProblem = useCallback((problem: MathProblem) => {
    if (!sessionState) return

    setSessionState(prev => {
      if (!prev) return null
      
      return {
        ...prev,
        incorrectProblems: prev.incorrectProblems.filter(p => 
          !(p.multiplicand === problem.multiplicand && p.multiplier === problem.multiplier)
        )
      }
    })
  }, [sessionState])

  const getCurrentProblem = useCallback(() => {
    if (!sessionState) return null

    // For both practice and placement sessions: get the current problem from the queue
    if (sessionState.currentProblemIndex < sessionState.problemQueue.length) {
      return sessionState.problemQueue[sessionState.currentProblemIndex]
    }

    return null
  }, [sessionState])

  const completeSession = useCallback(async () => {
    if (!sessionState) return

    try {
      // Update final session state
      await apiClient.updateSession(sessionState.sessionId, {
        itemsAttempted: sessionState.currentProblemIndex,
        itemsCorrect: sessionState.gridUpdates.filter(g => g.lastAttemptCorrect).length,
        accuracy: calculateAccuracy(
          sessionState.gridUpdates.filter(g => g.lastAttemptCorrect).length,
          sessionState.currentProblemIndex
        ),
        duration: 0 // This would be calculated from the actual session duration
      })

      // Mark session as completed
      await apiClient.completeSession(sessionState.sessionId)

      // Only update math grid progress for practice sessions, NOT placement tests
      if (sessionState.sessionType === 'practice' && sessionState.gridUpdates.length > 0) {
        // Get current user for correct studentId
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await apiClient.updateMathGrid(
            user.id, // Use correct studentId, not sessionId
            sessionState.gridUpdates
          )
        }
      }
    } catch (err) {
      console.error('Failed to complete session:', err)
    }

    setSessionState(null)
  }, [sessionState])

  return {
    sessionState,
    loading,
    error,
    startPlacementTest,
    startPracticeSession,
    submitAnswer,
    getNextProblem,
    advanceToNextProblem,
    getCurrentProblem,
    completeSession,
    removeIncorrectProblem,
    saveSessionProgress, // New
    checkForActiveSessions, // New
  }
}

// Helper functions
function generateMathProblems(
  multiplicandRange: [number, number],
  multiplierRange: [number, number],
  count: number
): MathProblem[] {
  const problems: MathProblem[] = []
  const usedProblems = new Set<string>()
  
  // Generate all possible problems in the range
  const allPossibleProblems: MathProblem[] = []
  for (let m = multiplicandRange[0]; m <= multiplicandRange[1]; m++) {
    for (let n = multiplierRange[0]; n <= multiplierRange[1]; n++) {
      allPossibleProblems.push({
        id: `problem-${m}-${n}`,
        multiplicand: m,
        multiplier: n,
        answer: m * n,
        difficulty: getDifficultyBand(m, n)
      })
    }
  }
  
  // Shuffle all possible problems
  const shuffledProblems = allPossibleProblems.sort(() => Math.random() - 0.5)
  
  // Select unique problems up to the requested count
  for (const problem of shuffledProblems) {
    if (problems.length >= count) break
    
    const problemKey = `${problem.multiplicand}×${problem.multiplier}`
    if (!usedProblems.has(problemKey)) {
      usedProblems.add(problemKey)
      problems.push({
        ...problem,
        id: `problem-${problems.length}` // Re-index for consistency
      })
    }
  }
  
  // If we don't have enough unique problems, fill with random ones
  while (problems.length < count) {
    const multiplicand = Math.floor(Math.random() * (multiplicandRange[1] - multiplicandRange[0] + 1)) + multiplicandRange[0]
    const multiplier = Math.floor(Math.random() * (multiplierRange[1] - multiplierRange[0] + 1)) + multiplierRange[0]
    const problemKey = `${multiplicand}×${multiplier}`
    
    if (!usedProblems.has(problemKey)) {
      usedProblems.add(problemKey)
      problems.push({
        id: `problem-${problems.length}`,
        multiplicand,
        multiplier,
        answer: multiplicand * multiplier,
        difficulty: getDifficultyBand(multiplicand, multiplier)
      })
    }
  }
  
  return problems
}

function getDifficultyBand(multiplicand: number, multiplier: number): 'basic' | 'intermediate' | 'advanced' {
  // Calculate difficulty based on the range of factors
  // Basic: 1-5 × 1-5 (25 facts)
  // Intermediate: 6-9 × any, or any × 6-9 (but not both in advanced range) 
  // Advanced: 10-12 × any, or any × 10-12
  
  const maxFactor = Math.max(multiplicand, multiplier)
  
  if (maxFactor <= 5) {
    return 'basic'
  } else if (maxFactor <= 9) {
    return 'intermediate'
  } else {
    return 'advanced'
  }
}

function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}
