import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, RotateCcw, X } from 'lucide-react'
import { useMathSession } from '@/hooks/useMathSession'

interface SessionRecoveryModalProps {
  isOpen: boolean
  onClose: () => void
  onResumeSession: (sessionId: string) => void
  onStartNewSession: () => void
}

export function SessionRecoveryModal({ 
  isOpen, 
  onClose, 
  onResumeSession, 
  onStartNewSession 
}: SessionRecoveryModalProps) {
  const { checkForActiveSessions } = useMathSession()
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadActiveSessions()
    }
  }, [isOpen])

  const loadActiveSessions = async () => {
    setLoading(true)
    try {
      const sessions = await checkForActiveSessions()
      setActiveSessions(sessions || [])
    } catch (err) {
      console.error('Failed to load active sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 border-white/20">
        <CardHeader className="relative">
          <CardTitle className="text-xl font-bold text-primary text-center">
            Resume Practice Session?
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Checking for active sessions...</p>
            </div>
          ) : activeSessions.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                We found an active practice session. Would you like to resume where you left off?
              </p>
              
              {activeSessions.map((session) => (
                <div key={session.id} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-blue-900">
                      {session.session_type === 'practice' ? 'Practice Session' : 'Placement Test'}
                    </h3>
                    <span className="text-xs text-blue-600">
                      {session.completed_items}/{session.total_items} completed
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Clock className="h-4 w-4" />
                    <span>
                      Started {new Date(session.started_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <RotateCcw className="h-4 w-4" />
                    <span>
                      Last active {new Date(session.last_activity_at).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    onClick={() => onResumeSession(session.id)}
                    className="w-full mt-3"
                    size="sm"
                  >
                    Resume Session
                  </Button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Button
                  onClick={onStartNewSession}
                  variant="outline"
                  className="flex-1"
                >
                  Start New Session
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                No active sessions found. Ready to start a new practice session?
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={onStartNewSession}
                  className="flex-1"
                >
                  Start New Session
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
