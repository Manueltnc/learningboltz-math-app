import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRoles } from '../hooks/useRoles'

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  createApiClient: vi.fn(() => ({
    getUserRoles: vi.fn(),
    isSuperAdmin: vi.fn()
  }))
}))

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    }
  }
}))

describe('useRoles', () => {
  const mockApiClient = {
    getUserRoles: vi.fn(),
    isSuperAdmin: vi.fn()
  }

  const mockSupabase = {
    auth: {
      getUser: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    })
    
    mockApiClient.getUserRoles.mockResolvedValue(['student'])
    mockApiClient.isSuperAdmin.mockResolvedValue(false)
  })

  it('should initialize with empty roles and not super admin', () => {
    const { result } = renderHook(() => useRoles())
    
    expect(result.current.roles).toEqual([])
    expect(result.current.isSuperAdmin).toBe(false)
    expect(result.current.loading).toBe(true)
  })

  it('should fetch user roles on mount', async () => {
    mockApiClient.getUserRoles.mockResolvedValue(['student', 'coach'])
    mockApiClient.isSuperAdmin.mockResolvedValue(false)

    const { result } = renderHook(() => useRoles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual(['student', 'coach'])
    expect(result.current.isSuperAdmin).toBe(false)
    expect(mockApiClient.getUserRoles).toHaveBeenCalledWith('test-user-id')
    expect(mockApiClient.isSuperAdmin).toHaveBeenCalledWith('test-user-id')
  })

  it('should detect super admin role', async () => {
    mockApiClient.getUserRoles.mockResolvedValue(['super_admin'])
    mockApiClient.isSuperAdmin.mockResolvedValue(true)

    const { result } = renderHook(() => useRoles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual(['super_admin'])
    expect(result.current.isSuperAdmin).toBe(true)
  })

  it('should handle no user gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null }
    })

    const { result } = renderHook(() => useRoles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual([])
    expect(result.current.isSuperAdmin).toBe(false)
  })

  it('should handle API errors', async () => {
    mockApiClient.getUserRoles.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useRoles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('API Error')
    expect(result.current.roles).toEqual([])
    expect(result.current.isSuperAdmin).toBe(false)
  })

  it('should provide role checking utilities', async () => {
    mockApiClient.getUserRoles.mockResolvedValue(['student', 'coach'])
    mockApiClient.isSuperAdmin.mockResolvedValue(false)

    const { result } = renderHook(() => useRoles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasRole('student')).toBe(true)
    expect(result.current.hasRole('coach')).toBe(true)
    expect(result.current.hasRole('admin')).toBe(false)

    expect(result.current.hasAnyRole(['student', 'admin'])).toBe(true)
    expect(result.current.hasAnyRole(['admin', 'super_admin'])).toBe(false)
  })

  it('should support refetching roles', async () => {
    mockApiClient.getUserRoles.mockResolvedValue(['student'])
    mockApiClient.isSuperAdmin.mockResolvedValue(false)

    const { result } = renderHook(() => useRoles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Update mock for refetch
    mockApiClient.getUserRoles.mockResolvedValue(['student', 'admin'])
    mockApiClient.isSuperAdmin.mockResolvedValue(false)

    await result.current.refetch()

    expect(result.current.roles).toEqual(['student', 'admin'])
    expect(mockApiClient.getUserRoles).toHaveBeenCalledTimes(2)
  })
})
