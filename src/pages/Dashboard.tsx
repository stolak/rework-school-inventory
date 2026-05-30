import { useMemo } from "react"
import {
  Package,
  Users,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  ShoppingCart,
  FileBarChart,
  Wallet,
  Landmark,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  accountTransactionsApi,
  inventoryApi,
  studentApi,
  type BalanceSheetHeadSection,
  type BalanceSheetReportData,
} from "@/lib/api"

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function parseAmount(v: string | number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

function isBalanceSheetHeadSection(v: unknown): v is BalanceSheetHeadSection {
  if (!v || typeof v !== "object") return false
  const o = v as Record<string, unknown>
  return (
    typeof o.headcode === "number" &&
    typeof o.name === "string" &&
    Array.isArray(o.subheads)
  )
}

function parseHeadSections(raw: BalanceSheetReportData | undefined): BalanceSheetHeadSection[] {
  if (!raw || typeof raw !== "object") return []
  return Object.values(raw).filter(isBalanceSheetHeadSection)
}

function formatMetricValue(value: number | undefined, isLoading: boolean): string {
  if (isLoading || value == null) return "—"
  return value.toLocaleString()
}

function formatMoneyValue(value: number | undefined, isLoading: boolean): string {
  if (isLoading || value == null) return "—"
  return `₦${money.format(value)}`
}

export default function Dashboard() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics", today],
    queryFn: async () => {
      const [studentsRes, balancesRes, balanceSheetRes, inventoryRes] = await Promise.all([
        studentApi.list({ status: "Active", page: 1, limit: 100 }),
        accountTransactionsApi.studentBalances({
          asAtDate: today,
          status: "Active",
          page: 1,
          limit: 100,
        }),
        accountTransactionsApi.reportByHeadSubhead({ transactionDateTo: today }),
        inventoryApi.list({ status: "Active", page: 1, limit: 100 }),
      ])
      const activeStudents =
      studentsRes.data.pagination.total ?? 0

      const balanceRows = balancesRes?.data?.rows ?? []
      const outstandingFees = balanceRows.reduce((sum, row) => {
        const balance = parseAmount(row.balance)
        return balance < 0 ? sum + Math.abs(balance) : sum
      }, 0)

      const headSections = parseHeadSections(
        balanceSheetRes?.success ? balanceSheetRes.data : undefined
      )
      const liabilitySection = headSections.find((h) =>
        h.name.toLowerCase().includes("liability")
      )
      const currentLiability = liabilitySection
        ? liabilitySection.subheads.reduce(
            (sum, sh) => sum + Math.abs(Number(sh.balance ?? 0)),
            0
          )
        : 0

      const inventoryItems = inventoryRes?.data?.inventoryItems ?? []
      const lowStockItems = inventoryItems.filter((item) => {
        const stock = Number(item.currentStock ?? 0)
        const threshold = Number(item.lowStockThreshold ?? 0)
        return stock <= threshold
      }).length

      return {
        activeStudents,
        outstandingFees,
        currentLiability,
        lowStockItems,
        liabilityLabel: liabilitySection?.name,
      }
    },
    staleTime: 60_000,
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s an overview of your school bookstore.
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
          title="Active Students"
          value={formatMetricValue(metrics?.activeStudents, isLoading)}
          change={{ value: "Currently enrolled", trend: "neutral" }}
          icon={Users}
          variant="success"
        />
        <MetricCard
          title="Outstanding Fees"
          value={formatMoneyValue(metrics?.outstandingFees, isLoading)}
          change={{ value: `As at ${today}`, trend: "neutral" }}
          icon={Wallet}
          variant="warning"
        />
        <MetricCard
          title="Current Liability"
          value={formatMoneyValue(metrics?.currentLiability, isLoading)}
          change={{
            value: metrics?.liabilityLabel ?? `As at ${today}`,
            trend: "neutral",
          }}
          icon={Landmark}
          variant="primary"
        />
        <MetricCard
          title="Low Stock Items"
          value={formatMetricValue(metrics?.lowStockItems, isLoading)}
          change={{ value: "At or below reorder level", trend: "down" }}
          icon={AlertTriangle}
          variant="warning"
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
