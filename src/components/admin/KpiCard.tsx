import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  loading?: boolean
}

export function KpiCard({ title, value, icon, trend, trendUp, loading }: KpiCardProps) {
  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:bg-white/90 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-primary">{value}</p>
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                trendUp ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
