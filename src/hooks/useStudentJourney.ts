import { useState, useEffect } from 'react'
import { createApiClient } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiClient = createApiClient(supabaseUrl, supabaseKey)

export type StudentJourneyState = 'needs_placement' | 'placement_in_progress' | 'placement_completed' | 'practice_ready'

export const useStudentJourney = () => {
  const [journeyState, setJourneyState] = useState<StudentJourneyState>('needs_placement')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJourneyState = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setJourneyState('needs_placement')
        return
      }

      const state = await apiClient.getCurrentJourneyState()
      setJourneyState(state)
    } catch (err) {
      console.error('Failed to fetch journey state:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch journey state')
      setJourneyState('needs_placement') // Default fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJourneyState()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchJourneyState()
      } else {
        setJourneyState('needs_placement')
        setLoading(false)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const refreshJourneyState = () => {
    fetchJourneyState()
  }

  return {
    journeyState,
    loading,
    error,
    refreshJourneyState,
    // Convenience getters
    needsPlacement: journeyState === 'needs_placement',
    placementInProgress: journeyState === 'placement_in_progress',
    placementCompleted: journeyState === 'placement_completed',
    practiceReady: journeyState === 'practice_ready' || journeyState === 'placement_completed',
    canStartPractice: journeyState === 'placement_completed' || journeyState === 'practice_ready',
    shouldShowPlacement: journeyState === 'needs_placement' || journeyState === 'placement_in_progress'
  }
}
