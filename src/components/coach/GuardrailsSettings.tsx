import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Settings, Save, RotateCcw } from 'lucide-react'
import type { Student } from '@/types'

interface GuardrailsSettingsProps {
  student: Student
  onUpdate: () => void
}

export function GuardrailsSettings({ student, onUpdate }: GuardrailsSettingsProps) {
  const [currentGuardrail, setCurrentGuardrail] = useState<'1-5' | '1-9' | '1-12'>('1-9')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchCurrentGuardrail()
  }, [student.id])

  const fetchCurrentGuardrail = async () => {
    try {
      // Fetch current guardrail level from math_grid_progress table
      const { data, error } = await supabase
        .from('math_grid_progress')
        .select('guardrails_level')
        .eq('student_id', student.id)
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setCurrentGuardrail(data?.guardrails_level || '1-9')
    } catch (err) {
      console.error('Failed to fetch current guardrail:', err)
      setCurrentGuardrail('1-9')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Update guardrail level in math_grid_progress table
      const { error } = await supabase
        .from('math_grid_progress')
        .update({
          guardrails_level: currentGuardrail,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', student.id)

      if (error) throw error

      setSuccess('Guardrail settings updated successfully!')
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update guardrail settings')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentGuardrail('1-9')
    setError(null)
    setSuccess(null)
  }

  const getGuardrailDescription = (guardrail: string) => {
    switch (guardrail) {
      case '1-5':
        return 'Basic level: Multiplication tables 1-5 (25 problems)'
      case '1-9':
        return 'Intermediate level: Multiplication tables 1-9 (81 problems)'
      case '1-12':
        return 'Advanced level: Multiplication tables 1-12 (144 problems)'
      default:
        return ''
    }
  }

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Guardrail Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Set the difficulty level for {student.displayName}. This determines which multiplication tables they can practice.
          </p>
          
          <div className="space-y-3">
            {(['1-5', '1-9', '1-12'] as const).map((guardrail) => (
              <label key={guardrail} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="guardrail"
                  value={guardrail}
                  checked={currentGuardrail === guardrail}
                  onChange={(e) => setCurrentGuardrail(e.target.value as '1-5' | '1-9' | '1-12')}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                />
                <div>
                  <div className="font-medium text-sm">
                    {guardrail === '1-5' ? 'Basic' : guardrail === '1-9' ? 'Intermediate' : 'Advanced'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getGuardrailDescription(guardrail)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
