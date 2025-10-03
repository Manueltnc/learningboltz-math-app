// Unified API Client for Math Times Tables App
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  MathProgress,
  MathGridCell,
  StudentSummary,
  TimeBucketConfig,
  DailyStudentMetrics,
  DailyDifficultyMetrics,
  CohortMetrics,
} from '@/types'

export type StudentJourneyState = 'needs_placement' | 'placement_in_progress' | 'placement_completed' | 'practice_ready'

export interface SessionUpdateData {
  itemsAttempted?: number
  itemsCorrect?: number
  accuracy?: number
  duration?: number
  averageTimePerQuestion?: number
  fastAnswersCount?: number
  mediumAnswersCount?: number
  slowAnswersCount?: number
}

export class UnifiedApiClient {
  private supabase: SupabaseClient

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  async createSession(
    appType: string,
    email: string,
    gradeLevel: string,
    metadata?: Record<string, any>
  ): Promise<{ sessionId: string }> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('learning_sessions')
      .insert({
        student_id: user.id,
        app_type: appType,
        session_type: metadata?.sessionType || 'practice',
        started_at: new Date().toISOString(),
        status: 'in_progress',
        total_items: metadata?.problems?.length || 0,
        metadata: metadata || {}
      })
      .select('id')
      .single()

    if (error) throw error
    return { sessionId: data.id }
  }

  async updateSession(sessionId: string, updates: SessionUpdateData): Promise<void> {
    const { error } = await this.supabase
      .from('learning_sessions')
      .update({
        completed_items: updates.itemsAttempted,
        correct_answers: updates.itemsCorrect,
        accuracy: updates.accuracy,
        duration_seconds: updates.duration,
        average_time_per_question: updates.averageTimePerQuestion,
        fast_answers_count: updates.fastAnswersCount,
        medium_answers_count: updates.mediumAnswersCount,
        slow_answers_count: updates.slowAnswersCount,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error
  }

  async completeSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('learning_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error
  }

  async recordQuestionAttempt(
    sessionId: string,
    studentId: string,
    multiplicand: number,
    multiplier: number,
    userAnswer: number,
    correctAnswer: number,
    isCorrect: boolean,
    timeSpent: number,
    attemptNumber: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('question_attempts')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        multiplicand,
        multiplier,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
        attempt_number: attemptNumber
      })

    if (error) throw error
  }

  // ============================================
  // MATH PROGRESS
  // ============================================

  async getMathProgress(email: string, gradeLevel: string): Promise<MathProgress> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('math_grid_progress')
      .select('*')
      .eq('student_id', user.id)
      .maybeSingle()

    if (error) throw error

    // If no progress exists, create initial grid
    if (!data) {
      const initialGrid = this.createInitialGrid()
      const { data: newData, error: insertError } = await this.supabase
        .from('math_grid_progress')
        .insert({
          student_id: user.id,
          grid_state: initialGrid,
          guardrails_level: '1-9',
          total_correct_answers: 0,
          total_attempts: 0
        })
        .select()
        .single()

      if (insertError) throw insertError

      return {
        studentId: user.id,
        gridState: initialGrid,
        currentGuardrail: '1-9',
        totalCorrectAnswers: 0,
        totalAttempts: 0,
        lastUpdated: new Date()
      }
    }

    return {
      studentId: data.student_id,
      gridState: data.grid_state,
      currentGuardrail: data.guardrails_level,
      totalCorrectAnswers: data.total_correct_answers || 0,
      totalAttempts: data.total_attempts || 0,
      lastUpdated: new Date(data.updated_at)
    }
  }

  async updateMathGrid(studentId: string, gridUpdates: MathGridCell[]): Promise<void> {
    // Fetch current grid
    const { data: currentData, error: fetchError } = await this.supabase
      .from('math_grid_progress')
      .select('grid_state, total_correct_answers, total_attempts')
      .eq('student_id', studentId)
      .maybeSingle()

    if (fetchError) throw fetchError
    
    // If no grid exists, create one first
    if (!currentData) {
      const initialGrid = this.createInitialGrid()
      await this.supabase
        .from('math_grid_progress')
        .insert({
          student_id: studentId,
          grid_state: initialGrid,
          guardrails_level: '1-9',
          total_correct_answers: 0,
          total_attempts: 0
        })
      
      // Retry fetch
      const { data: retryData, error: retryError } = await this.supabase
        .from('math_grid_progress')
        .select('grid_state, total_correct_answers, total_attempts')
        .eq('student_id', studentId)
        .maybeSingle()
      
      if (retryError || !retryData) throw retryError || new Error('Failed to create grid')
      
      // Use the newly created grid
      const gridState = retryData.grid_state as MathGridCell[][]
      let totalCorrect = retryData.total_correct_answers || 0
      let totalAttempts = retryData.total_attempts || 0
      
      // Apply updates
      gridUpdates.forEach(update => {
        const row = update.multiplicand - 1
        const col = update.multiplier - 1
        if (row >= 0 && row < gridState.length && col >= 0 && col < gridState[row].length) {
          gridState[row][col] = { ...gridState[row][col], ...update }
          if (update.lastAttemptCorrect) totalCorrect++
          totalAttempts++
        }
      })
      
      // Update in database
      const { error: updateError } = await this.supabase
        .from('math_grid_progress')
        .update({
          grid_state: gridState,
          total_correct_answers: totalCorrect,
          total_attempts: totalAttempts,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentId)
      
      if (updateError) throw updateError
      return
    }

    const gridState = currentData.grid_state as MathGridCell[][]
    let totalCorrect = currentData.total_correct_answers || 0
    let totalAttempts = currentData.total_attempts || 0

    // Apply updates
    gridUpdates.forEach(update => {
      const row = update.multiplicand - 1
      const col = update.multiplier - 1
      if (row >= 0 && row < gridState.length && col >= 0 && col < gridState[row].length) {
        gridState[row][col] = { ...gridState[row][col], ...update }
        if (update.lastAttemptCorrect) totalCorrect++
        totalAttempts++
      }
    })

    // Update in database
    const { error: updateError } = await this.supabase
      .from('math_grid_progress')
      .update({
        grid_state: gridState,
        total_correct_answers: totalCorrect,
        total_attempts: totalAttempts,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)

    if (updateError) throw updateError
  }

  async setMathGuardrail(studentId: string, guardrail: '1-5' | '1-9' | '1-12'): Promise<void> {
    const { error } = await this.supabase
      .from('math_grid_progress')
      .update({
        guardrails_level: guardrail,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)

    if (error) throw error
  }

  // ============================================
  // USER ROLES
  // ============================================

  async getUserRoles(userId: string): Promise<string[]> {
    // Check auth.users metadata for role
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return []
    
    const role = user.user_metadata?.role
    return role ? [role] : ['student']
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return false
    
    return user.user_metadata?.role === 'super_admin'
  }

  // ============================================
  // STUDENT JOURNEY
  // ============================================

  async getCurrentJourneyState(): Promise<StudentJourneyState> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return 'needs_placement'

    // Check if student has completed placement test
    const { data: sessions, error } = await this.supabase
      .from('learning_sessions')
      .select('session_type, status')
      .eq('student_id', user.id)
      .eq('app_type', 'math')
      .order('created_at', { ascending: false })

    if (error) return 'needs_placement'

    const completedPlacement = sessions?.some(
      s => s.session_type === 'placement' && s.status === 'completed'
    )

    if (completedPlacement) return 'placement_completed'

    const inProgressPlacement = sessions?.some(
      s => s.session_type === 'placement' && s.status === 'in_progress'
    )

    if (inProgressPlacement) return 'placement_in_progress'

    return 'needs_placement'
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getDailyStudentMetrics(
    studentId: string,
    options?: {
      startDate?: string
      endDate?: string
      appType?: string
    }
  ): Promise<DailyStudentMetrics[]> {
    let query = this.supabase
      .from('daily_student_metrics')
      .select('*')
      .eq('student_id', studentId)

    if (options?.appType) {
      query = query.eq('app_type', options.appType)
    }

    if (options?.startDate) {
      query = query.gte('metric_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('metric_date', options.endDate)
    }

    const { data, error } = await query.order('metric_date', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getDailyDifficultyMetrics(
    studentId: string,
    options?: {
      startDate?: string
      endDate?: string
      appType?: string
    }
  ): Promise<DailyDifficultyMetrics[]> {
    let query = this.supabase
      .from('daily_difficulty_metrics')
      .select('*')
      .eq('student_id', studentId)

    if (options?.appType) {
      query = query.eq('app_type', options.appType)
    }

    if (options?.startDate) {
      query = query.gte('metric_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('metric_date', options.endDate)
    }

    const { data, error } = await query.order('metric_date', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getCohortMetrics(options?: {
    startDate?: string
    endDate?: string
    gradeLevel?: string
  }): Promise<CohortMetrics> {
    // This is a simplified version - in production you'd want to use database functions
    const { data: metrics, error } = await this.supabase
      .from('daily_student_metrics')
      .select('*')

    if (error) throw error

    // Calculate aggregates
    const totalStudents = new Set(metrics?.map(m => m.student_id)).size
    const totalAttempts = metrics?.reduce((sum, m) => sum + m.attempted, 0) || 0
    const totalCorrect = metrics?.reduce((sum, m) => sum + m.correct, 0) || 0
    const averageAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0
    const averageTimePerQuestion = metrics?.reduce((sum, m) => sum + m.avg_time_seconds, 0) / (metrics?.length || 1) || 0

    // Get difficulty breakdown
    const { data: difficultyData } = await this.supabase
      .from('daily_difficulty_metrics')
      .select('*')

    const difficultyBreakdown = {
      basic: { attempted: 0, correct: 0, avgTime: 0 },
      intermediate: { attempted: 0, correct: 0, avgTime: 0 },
      advanced: { attempted: 0, correct: 0, avgTime: 0 }
    }

    difficultyData?.forEach(d => {
      if (d.difficulty_band in difficultyBreakdown) {
        difficultyBreakdown[d.difficulty_band as keyof typeof difficultyBreakdown].attempted += d.attempted
        difficultyBreakdown[d.difficulty_band as keyof typeof difficultyBreakdown].correct += d.correct
        difficultyBreakdown[d.difficulty_band as keyof typeof difficultyBreakdown].avgTime += d.avg_time_seconds
      }
    })

    return {
      totalStudents,
      totalAttempts,
      averageAccuracy,
      averageTimePerQuestion,
      difficultyBreakdown
    }
  }

  async getTimeBucketConfig(): Promise<TimeBucketConfig> {
    const { data, error } = await this.supabase
      .from('app_config')
      .select('value')
      .eq('key', 'time_bucket_config')
      .single()

    if (error || !data) {
      return { fastThreshold: 5, mediumThreshold: 15 }
    }

    return data.value as TimeBucketConfig
  }

  async setTimeBucketConfig(config: TimeBucketConfig): Promise<void> {
    const { error } = await this.supabase
      .from('app_config')
      .upsert({
        key: 'time_bucket_config',
        value: config,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
  }

  async listStudents(options?: {
    page?: number
    pageSize?: number
    gradeLevel?: string
  }): Promise<{ students: StudentSummary[]; total: number; pages: number }> {
    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const offset = (page - 1) * pageSize

    // This is a simplified version - you'd want to create a database view or function for this
    const { data, error, count } = await this.supabase
      .from('math_grid_progress')
      .select('*', { count: 'exact' })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    const students: StudentSummary[] = (data || []).map(d => ({
      id: d.student_id,
      email: 'student@example.com', // You'd join with auth.users
      displayName: 'Student',
      gradeLevel: '3',
      currentGuardrail: d.guardrails_level,
      totalAttempts: d.total_attempts || 0,
      accuracy: d.total_attempts > 0 ? Math.round((d.total_correct_answers / d.total_attempts) * 100) : 0,
      avgTimePerQuestion: 0,
      masteryPercentage: 0,
      lastActive: d.updated_at
    }))

    return {
      students,
      total: count || 0,
      pages: Math.ceil((count || 0) / pageSize)
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private createInitialGrid(): MathGridCell[][] {
    const grid: MathGridCell[][] = []
    for (let row = 0; row < 12; row++) {
      const rowCells: MathGridCell[] = []
      for (let col = 0; col < 12; col++) {
        rowCells.push({
          multiplicand: row + 1,
          multiplier: col + 1,
          consecutiveCorrect: 0,
          lastAttemptCorrect: false,
          attempts: 0,
          isLocked: false,
          averageTimeSeconds: 0,
          totalTimeSpent: 0
        })
      }
      grid.push(rowCells)
    }
    return grid
  }
}

// Factory function to create API client
export function createApiClient(supabaseUrl: string, supabaseKey: string): UnifiedApiClient {
  return new UnifiedApiClient(supabaseUrl, supabaseKey)
}

