import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: "purchase" | "sale" | "distribution" | "low_stock"
  title: string
  description: string
  timestamp: Date
  user?: string
  status?: "completed" | "pending" | "cancelled"
}

// Mock data for demonstration
const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "purchase",
    title: "New inventory received",
    description: "Mathematics Textbooks (Grade 5) - 50 units",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    user: "John Smith",
    status: "completed"
  },
  {
    id: "2",
    type: "distribution",
    title: "Class distribution completed",
    description: "English Notebooks distributed to Class 3A",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    user: "Sarah Wilson",
    status: "completed"
  },
  {
    id: "3",
    type: "low_stock",
    title: "Low stock alert",
    description: "Science Workbooks - Only 5 units remaining",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    status: "pending"
  },
  {
    id: "4",
    type: "sale",
    title: "Item sold",
    description: "Calculator (Scientific) - 3 units",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    user: "Mike Johnson",
    status: "completed"
  }
]

export function RecentActivity() {
  const getActivityIcon = (type: string) => {
    const firstLetter = type.charAt(0).toUpperCase()
    const colors = {
      purchase: "bg-success/10 text-success",
      sale: "bg-primary/10 text-primary",
      distribution: "bg-accent/10 text-accent",
      low_stock: "bg-warning/10 text-warning"
    }
    return {
      letter: firstLetter,
      className: colors[type as keyof typeof colors] || "bg-muted text-muted-foreground"
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    const variants = {
      completed: "bg-success/10 text-success",
      pending: "bg-warning/10 text-warning",
      cancelled: "bg-destructive/10 text-destructive"
    }
    
    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    )
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {mockActivities.map((activity, index) => {
            const icon = getActivityIcon(activity.type)
            return (
              <div 
                key={activity.id} 
                className={`p-4 hover:bg-muted/30 transition-colors ${
                  index !== mockActivities.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className={`h-8 w-8 ${icon.className}`}>
                    <AvatarFallback className="text-xs font-medium">
                      {icon.letter}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                          </p>
                          {activity.user && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
                                by {activity.user}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}