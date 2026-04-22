import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    trend: "up" | "down" | "neutral"
  }
  icon: LucideIcon
  variant?: "default" | "warning" | "success" | "primary"
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  variant = "default" 
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20"
      case "success":
        return "bg-gradient-to-br from-success/10 to-success/5 border-success/20"
      case "primary":
        return "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
      default:
        return "bg-gradient-to-br from-card to-muted/20"
    }
  }

  const getIconStyles = () => {
    switch (variant) {
      case "warning":
        return "text-warning bg-warning/10"
      case "success":
        return "text-success bg-success/10"
      case "primary":
        return "text-primary bg-primary/10"
      default:
        return "text-muted-foreground bg-muted/50"
    }
  }

  const getTrendColor = () => {
    if (!change) return ""
    switch (change.trend) {
      case "up":
        return "text-success"
      case "down":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className={`shadow-card hover:shadow-elevated transition-all duration-300 ${getVariantStyles()}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
              <p className={`text-xs mt-1 ${getTrendColor()}`}>
                {change.value}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${getIconStyles()}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}