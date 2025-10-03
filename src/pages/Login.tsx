import { useState } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { Calculator, BookOpen } from 'lucide-react'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignup, setIsSignup] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* App Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Multiplication Wizard</h1>
              <p className="text-muted-foreground italic">A Learning Boltz Experience</p>
              <p className="text-sm text-muted-foreground">Master multiplication with confidence</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Educational Learning Platform</span>
          </div>
        </div>

        {/* Auth Form */}
        {isSignup ? (
          <SignupForm
            onSuccess={onLogin}
            onSwitchToLogin={() => setIsSignup(false)}
          />
        ) : (
          <LoginForm
            onSuccess={onLogin}
            onSwitchToSignup={() => setIsSignup(true)}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>© 2024 Education Apps Unified. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
