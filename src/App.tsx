import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRoles } from '@/hooks/useRoles'
import { LoginPage } from '@/pages/Login'
import { StudentHome } from '@/pages/StudentHome'
import { PracticePage } from '@/pages/Practice'
import { CoachDashboard } from '@/pages/CoachDashboard'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { ProgressGrid } from '@/components/student/ProgressGrid'
import { Loader2 } from 'lucide-react'

function App() {
  const { user, loading } = useAuth()
  const { isSuperAdmin, loading: rolesLoading } = useRoles()
  const [currentPage, setCurrentPage] = useState<'home' | 'practice' | 'progress' | 'coach' | 'admin'>('home')
  const [desiredMode, setDesiredMode] = useState<'practice' | 'placement' | undefined>(undefined)

  if (loading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Multiplication Wizard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={() => {}} />
  }

  const isCoach = user.user_metadata?.role === 'coach'

  const handleLogout = async () => {
    // This would typically call a logout function
    window.location.reload()
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <StudentHome
            onStartPlacement={(mode) => {
              setDesiredMode(mode)
              setCurrentPage('practice')
            }}
            onStartPractice={(mode) => {
              setDesiredMode(mode)
              setCurrentPage('practice')
            }}
            onViewProgress={() => setCurrentPage('progress')}
            onLogout={handleLogout}
          />
        )
      case 'practice':
        return (
          <PracticePage
            onBack={() => {
              setDesiredMode(undefined)
              setCurrentPage('home')
            }}
            autoStart={true}
            desiredMode={desiredMode}
            key="practice-page" // Force re-render when navigating to practice
          />
        )
      case 'progress':
        return (
          <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <button
                  onClick={() => setCurrentPage('home')}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  ← Back to Home
                </button>
              </div>
              <ProgressGrid
                email={user.email || ''}
                gradeLevel={user.user_metadata?.grade_level || '3'}
              />
            </div>
          </div>
        )
      case 'coach':
        return (
          <CoachDashboard
            onLogout={handleLogout}
          />
        )
      case 'admin':
        return (
          <AdminDashboard
            onLogout={handleLogout}
          />
        )
      default:
        return (
          <StudentHome
            onStartPlacement={(mode) => {
              setDesiredMode(mode)
              setCurrentPage('practice')
            }}
            onStartPractice={(mode) => {
              setDesiredMode(mode)
              setCurrentPage('practice')
            }}
            onViewProgress={() => setCurrentPage('progress')}
            onLogout={handleLogout}
          />
        )
    }
  }

  return (
    <Router>
      <div className="App">
        {isSuperAdmin ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : isCoach ? (
          <CoachDashboard onLogout={handleLogout} />
        ) : (
          renderCurrentPage()
        )}
      </div>
    </Router>
  )
}

export default App
