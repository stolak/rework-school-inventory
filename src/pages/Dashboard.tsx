import { 
  Package, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  BookOpen,
  GraduationCap,
  ShoppingCart,
  FileBarChart
} from "lucide-react"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your school bookstore.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileBarChart className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button size="sm" className="bg-gradient-primary">
            <Package className="mr-2 h-4 w-4" />
            Add Inventory
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Inventory Items"
          value="1,247"
          change={{ value: "+12% from last month", trend: "up" }}
          icon={Package}
          variant="primary"
        />
        <MetricCard
          title="Active Students"
          value="856"
          change={{ value: "+5% from last term", trend: "up" }}
          icon={Users}
          variant="success"
        />
        <MetricCard
          title="Low Stock Items"
          value="23"
          change={{ value: "Needs attention", trend: "down" }}
          icon={AlertTriangle}
          variant="warning"
        />
        <MetricCard
          title="Monthly Sales"
          value="₦285,430"
          change={{ value: "+18% from last month", trend: "up" }}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* Quick Stats & Actions */}
        <div className="space-y-6">
          {/* Class Distribution Summary */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Class Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Grade 1-3</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Grade 4-6</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Grade 7-9</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View All Distributions
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Add New Book
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Register Student
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                New Purchase Order
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <GraduationCap className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}