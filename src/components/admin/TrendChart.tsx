import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TrendChartProps {
  title: string
  data: any[]
  loading?: boolean
}

export function TrendChart({ title, data, loading }: TrendChartProps) {
  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">Chart visualization coming soon</p>
            <p className="text-xs mt-1">Data: {data.length} points</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
