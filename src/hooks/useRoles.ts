import { useState, useEffect } from 'react'
import { createApiClient } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiClient = createApiClient(supabaseUrl, supabaseKey)

export function useRoles() {
  const [roles, setRoles] = useState<string[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserRoles()
  }, [])

  const fetchUserRoles = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setRoles([])
        setIsSuperAdmin(false)
        return
      }

      // Fetch user roles
      const userRoles = await apiClient.getUserRoles(user.id)
      setRoles(userRoles)

      // Check if user is super admin
      const isAdmin = await apiClient.isSuperAdmin(user.id)
      setIsSuperAdmin(isAdmin)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user roles')
      setRoles([])
      setIsSuperAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (role: string): boolean => {
    return roles.includes(role)
  }

  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some(role => roles.includes(role))
  }

  return {
    roles,
    isSuperAdmin,
    loading,
    error,
    hasRole,
    hasAnyRole,
    refetch: fetchUserRoles
  }
}
