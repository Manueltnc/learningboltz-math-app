import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { StudentDashboard } from '@/components/coach/StudentDashboard'
import { GuardrailsSettings } from '@/components/coach/GuardrailsSettings'
import { Users, Settings, LogOut, BarChart3 } from 'lucide-react'

interface CoachDashboardProps {
  onLogout: () => void
}

export function CoachDashboard({ onLogout }: CoachDashboardProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'students' | 'settings'>('students')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-white/20">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please log in to access coach dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Multiplication Wizard</h1>
              <p className="text-muted-foreground italic">A Learning Boltz Experience</p>
              <p className="text-sm text-muted-foreground">Coach Dashboard - Welcome, {user.user_metadata?.display_name || user.email}</p>
            </div>
          </div>
          <Button onClick={onLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'students' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('students')}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Students
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('settings')}
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Content */}
        {activeTab === 'students' && (
          <StudentDashboard coachId={user.id} />
        )}

        {activeTab === 'settings' && selectedStudent && (
          <div className="max-w-2xl mx-auto">
            <GuardrailsSettings
              student={selectedStudent}
              onUpdate={() => {
                // Refresh student data
                setSelectedStudent(null)
              }}
            />
          </div>
        )}

        {activeTab === 'settings' && !selectedStudent && (
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <CardContent className="p-12 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a student to adjust their settings</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
