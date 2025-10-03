import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface DifficultyBreakdownProps {
  title: string
  data?: {
    basic: { attempted: number; correct: number; avgTime: number }
    intermediate: { attempted: number; correct: number; avgTime: number }
    advanced: { attempted: number; correct: number; avgTime: number }
  }
  loading?: boolean
}

export function DifficultyBreakdown({ title, data, loading }: DifficultyBreakdownProps) {
  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const difficulties = [
    { key: 'basic', label: 'Basic (1-5)', color: 'bg-green-500', data: data.basic },
    { key: 'intermediate', label: 'Intermediate (1-9)', color: 'bg-yellow-500', data: data.intermediate },
    { key: 'advanced', label: 'Advanced (1-12)', color: 'bg-red-500', data: data.advanced }
  ]

  const totalAttempts = difficulties.reduce((sum, d) => sum + d.data.attempted, 0)

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {difficulties.map((difficulty) => {
            const percentage = totalAttempts > 0 ? (difficulty.data.attempted / totalAttempts) * 100 : 0
            const accuracy = difficulty.data.attempted > 0 ? (difficulty.data.correct / difficulty.data.attempted) * 100 : 0

            return (
              <div key={difficulty.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{difficulty.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {difficulty.data.attempted} attempts ({accuracy.toFixed(1)}% accuracy)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Avg time: {difficulty.data.avgTime.toFixed(1)}s</span>
                  <span>{percentage.toFixed(1)}% of total</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
