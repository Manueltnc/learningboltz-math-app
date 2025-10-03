import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminDashboard } from '../pages/AdminDashboard'

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  createApiClient: vi.fn(() => ({
    getCohortMetrics: vi.fn(),
    listStudents: vi.fn(),
    getTimeBucketConfig: vi.fn(),
    setTimeBucketConfig: vi.fn()
  }))
}))

// Mock the auth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user',
      email: 'admin@test.com',
      user_metadata: { display_name: 'Test Admin' }
    }
  }))
}))

describe('AdminDashboard', () => {
  const mockApiClient = {
    getCohortMetrics: vi.fn(),
    listStudents: vi.fn(),
    getTimeBucketConfig: vi.fn(),
    setTimeBucketConfig: vi.fn()
  }

  const mockCohortMetrics = {
    totalStudents: 25,
    totalAttempts: 1250,
    totalCorrect: 1000,
    avgAccuracy: 80,
    avgTimePerQuestion: 12.5,
    difficultyBreakdown: {
      basic: { attempted: 500, correct: 450, avgTime: 8.5 },
      intermediate: { attempted: 500, correct: 400, avgTime: 12.0 },
      advanced: { attempted: 250, correct: 150, avgTime: 18.0 }
    },
    timeBucketBreakdown: {
      fast: 400,
      medium: 600,
      slow: 250
    }
  }

  const mockStudents = [
    {
      id: 'student-1',
      email: 'student1@test.com',
      displayName: 'Student One',
      gradeLevel: '3',
      lastActive: new Date('2024-01-15'),
      totalAttempts: 50,
      totalCorrect: 40,
      accuracy: 80,
      avgTimePerQuestion: 12.5,
      currentGuardrail: '1-9' as const,
      masteryPercentage: 75
    },
    {
      id: 'student-2',
      email: 'student2@test.com',
      displayName: 'Student Two',
      gradeLevel: '4',
      lastActive: new Date('2024-01-14'),
      totalAttempts: 75,
      totalCorrect: 60,
      accuracy: 80,
      avgTimePerQuestion: 15.0,
      currentGuardrail: '1-12' as const,
      masteryPercentage: 85
    }
  ]

  const mockTimeBucketConfig = {
    fastThreshold: 5,
    mediumThreshold: 15
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockApiClient.getCohortMetrics.mockResolvedValue(mockCohortMetrics)
    mockApiClient.listStudents.mockResolvedValue({
      students: mockStudents,
      total: 2
    })
    mockApiClient.getTimeBucketConfig.mockResolvedValue(mockTimeBucketConfig)
    mockApiClient.setTimeBucketConfig.mockResolvedValue(undefined)
  })

  it('should render admin dashboard with header', async () => {
    render(<AdminDashboard onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Welcome, Test Admin')).toBeInTheDocument()
    })
  })

  it('should display KPI cards with metrics', async () => {
    render(<AdminDashboard onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument() // Total Students
      expect(screen.getByText('1,250')).toBeInTheDocument() // Total Attempts
      expect(screen.getByText('80%')).toBeInTheDocument() // Average Accuracy
      expect(screen.getByText('12.5s')).toBeInTheDocument() // Avg Time/Question
    })
  })

  it('should display filters section', async () => {
    render(<AdminDashboard onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('Date Range')).toBeInTheDocument()
      expect(screen.getByText('Grade Level')).toBeInTheDocument()
      expect(screen.getByText('Time Buckets')).toBeInTheDocument()
    })
  })

  it('should display students table', async () => {
    render(<AdminDashboard onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Students Overview')).toBeInTheDocument()
      expect(screen.getByText('Student One')).toBeInTheDocument()
      expect(screen.getByText('Student Two')).toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    // Mock delayed response
    mockApiClient.getCohortMetrics.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockCohortMetrics), 100))
    )

    render(<AdminDashboard onLogout={vi.fn()} />)

    expect(screen.getByText('Loading admin dashboard...')).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    mockApiClient.getCohortMetrics.mockRejectedValue(new Error('API Error'))

    render(<AdminDashboard onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('should display difficulty breakdown', async () => {
    render(<AdminDashboard onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Difficulty Performance')).toBeInTheDocument()
      expect(screen.getByText('Basic (1-5)')).toBeInTheDocument()
      expect(screen.getByText('Intermediate (1-9)')).toBeInTheDocument()
      expect(screen.getByText('Advanced (1-12)')).toBeInTheDocument()
    })
  })

  it('should show trend chart placeholder', async () => {
    render(<AdminDashboard onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Daily Activity Trends')).toBeInTheDocument()
      expect(screen.getByText('Chart visualization coming soon')).toBeInTheDocument()
    })
  })

  it('should handle logout', async () => {
    const mockLogout = vi.fn()
    render(<AdminDashboard onLogout={mockLogout} />)

    await waitFor(() => {
      const logoutButton = screen.getByText('Logout')
      logoutButton.click()
    })

    expect(mockLogout).toHaveBeenCalled()
  })
})
