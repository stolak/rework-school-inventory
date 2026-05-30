import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Eye, Filter, ShoppingBag, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Combobox } from "@/components/ui/combobox"
import { useStores } from "@/hooks/useStores"
import { SaleDialog } from "@/components/dialogs/SaleDialog"
import {
  useSales,
  type GroupedSale,
  groupedSaleCustomerName,
  groupedSaleKey,
  groupedSaleTotalAmount,
  groupedSaleTotalQty,
} from "@/hooks/useSales"
import { TablePaginationBar } from "@/components/ui/table-pagination-bar"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SaleCreateFormData } from "@/components/forms/SaleCreateForm"

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [storeId, setStoreId] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "view">("add")
  const [selectedGroup, setSelectedGroup] = useState<GroupedSale | undefined>()
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [storeId, startDate, endDate, limit])

  const listQuery = useMemo(
    () => ({
      storeId: storeId || undefined,
      transactionDateFrom: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      transactionDateTo: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      page,
      limit,
    }),
    [storeId, startDate, endDate, page, limit]
  )

  const { stores: activeStores } = useStores({ status: "Active", page: 1, limit: 100 })

  const { groupedSales, pagination, isLoading, bulkCreateSales } = useSales(listQuery)
  const { toast } = useToast()

  const filteredGroups = useMemo(
    () =>
      groupedSales.filter((group) => {
        if (statusFilter !== "all" && group.status !== statusFilter) return false
        if (!searchTerm.trim()) return true
        const q = searchTerm.toLowerCase()
        const customer = groupedSaleCustomerName(group).toLowerCase()
        return (
          (group.referenceNo || "").toLowerCase().includes(q) ||
          customer.includes(q) ||
          (group.store?.name || "").toLowerCase().includes(q) ||
          group.items.some((line) => (line.item?.name || "").toLowerCase().includes(q))
        )
      }),
    [groupedSales, searchTerm, statusFilter]
  )

  const handleAdd = () => {
    setDialogMode("add")
    setSelectedGroup(undefined)
    setDialogOpen(true)
  }

  const handleView = (group: GroupedSale) => {
    setDialogMode("view")
    setSelectedGroup(group)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: unknown) => {
    if (dialogMode !== "add") return

    const form = data as SaleCreateFormData

    toast({
      title: "Adding...",
      description: "Please wait while we save the sale",
    })

    const saleData = {
      storeId: form.storeId,
      ref: form.ref?.trim() ? form.ref.trim() : undefined,
      note: form.note?.trim() ? form.note.trim() : undefined,
      customerName: form.customerName.trim(),
      transactionDate: form.transactionDate.toISOString(),
      items: form.items.map((it) => ({
        id: it.itemId,
        qty: Number(it.qty),
        amount: Number(it.amount),
      })),
    }

    await bulkCreateSales(saleData)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalValue = filteredGroups.reduce(
    (sum, g) => sum + groupedSaleTotalAmount(g),
    0
  )
  const completedSales = filteredGroups.filter((g) => g.status === "completed").length
  const pendingSales = filteredGroups.filter((g) => g.status === "pending").length

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            Sales
          </h1>
          <p className="text-muted-foreground mt-1">
            Record inventory sales and review grouped sale transactions.
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredGroups.length} sale{filteredGroups.length !== 1 ? "s" : ""} on this page
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedSales}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingSales}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by customer, item, store, or reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-col xl:flex-row flex-wrap gap-4">
        <div className="w-full sm:w-[220px]">
          <Combobox
            value={storeId}
            onValueChange={setStoreId}
            options={[
              { value: "", label: "All stores" },
              ...activeStores.map((s) => ({ value: s.id, label: s.name })),
            ]}
            placeholder="Store"
            searchPlaceholder="Search stores..."
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full sm:w-[220px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full sm:w-[220px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-md">
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 w-full xl:w-auto xl:ml-auto">
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
          >
            Table
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading sales…</div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <Card key={groupedSaleKey(group)} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {group.referenceNo || "N/A"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {groupedSaleCustomerName(group) || "No customer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {group.store?.name ? `Store: ${group.store.name}` : "Store: —"}
                    </p>
                  </div>
                  {getStatusBadge(group.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {group.items.length} line item{group.items.length !== 1 ? "s" : ""}
                  </p>
                  <ul className="space-y-1">
                    {group.items.slice(0, 3).map((line) => (
                      <li key={line.id} className="flex justify-between gap-2">
                        <span className="truncate">{line.item?.name || "N/A"}</span>
                        <span className="shrink-0 text-muted-foreground">×{line.qtyOut}</span>
                      </li>
                    ))}
                    {group.items.length > 3 ? (
                      <li className="text-xs text-muted-foreground">
                        +{group.items.length - 3} more
                      </li>
                    ) : null}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Qty</p>
                    <p className="font-semibold">{groupedSaleTotalQty(group)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">
                      ₦{groupedSaleTotalAmount(group).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {group.transactionDate
                        ? new Date(group.transactionDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                {group.notes ? (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="text-foreground line-clamp-2">{group.notes}</p>
                  </div>
                ) : null}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(group)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total qty</TableHead>
                  <TableHead className="text-right">Total amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow key={groupedSaleKey(group)}>
                    <TableCell className="font-medium">{group.referenceNo || "N/A"}</TableCell>
                    <TableCell>{groupedSaleCustomerName(group) || "—"}</TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {group.store?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-[160px]">
                        {group.items.map((line) => (
                          <div
                            key={line.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="truncate">{line.item?.name || "N/A"}</span>
                            <span className="shrink-0 text-muted-foreground tabular-nums">
                              ×{line.qtyOut}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {groupedSaleTotalQty(group)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ₦{groupedSaleTotalAmount(group).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {group.transactionDate
                        ? new Date(group.transactionDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(group.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleView(group)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!isLoading && pagination && (
            <TablePaginationBar
              pagination={pagination}
              totalLabel="Total sales"
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit)
                setPage(1)
              }}
            />
          )}
        </div>
      )}

      {!isLoading && filteredGroups.length === 0 && (
        <div className="text-center py-10">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No sales found</h3>
          <p className="text-muted-foreground">
            {searchTerm || storeId || statusFilter !== "all" || startDate || endDate
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first sale."}
          </p>
          {!searchTerm && !storeId && statusFilter === "all" && !startDate && !endDate && (
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Sale
            </Button>
          )}
        </div>
      )}

      <SaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        groupedSale={selectedGroup}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
