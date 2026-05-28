import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Eye, Trash2, Filter, ShoppingCart, CalendarIcon } from "lucide-react"
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
import { useInventory } from "@/hooks/useInventory"
import { useSuppliers } from "@/hooks/useSuppliers"
import { useStores } from "@/hooks/useStores"
import { PurchaseDialog } from "@/components/dialogs/PurchaseDialog"
import {
  usePurchases,
  type GroupedPurchase,
  groupedPurchaseTotalCost,
  groupedPurchaseTotalQty,
} from "@/hooks/usePurchases"
import { TablePaginationBar } from "@/components/ui/table-pagination-bar"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Purchases() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [itemId, setItemId] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [storeId, setStoreId] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedGroup, setSelectedGroup] = useState<GroupedPurchase | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<GroupedPurchase | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [supplierId, storeId, startDate, endDate, limit])

  const listQuery = useMemo(
    () => ({
      supplierId: supplierId || undefined,
      storeId: storeId || undefined,
      transactionDateFrom: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      transactionDateTo: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      page,
      limit,
    }),
    [supplierId, storeId, startDate, endDate, page, limit]
  )

  const { items: inventoryItems } = useInventory({ page: 1, limit: 100 })
  const { suppliers } = useSuppliers({ status: "Active", page: 1, limit: 100 })
  const { stores: activeStores } = useStores({ status: "Active", page: 1, limit: 100 })

  const {
    groupedPurchases,
    pagination,
    isLoading,
    bulkCreatePurchases,
    deletePurchase,
  } = usePurchases(listQuery)
  const { toast } = useToast()

  /** Client-side: search, item, and status filters on grouped rows. */
  const filteredGroups = useMemo(
    () =>
      groupedPurchases.filter((group) => {
        if (statusFilter !== "all" && group.status !== statusFilter) return false
        if (itemId && !group.items.some((line) => line.itemId === itemId)) return false
        if (!searchTerm.trim()) return true
        const q = searchTerm.toLowerCase()
        return (
          (group.referenceNo || "").toLowerCase().includes(q) ||
          (group.supplier?.name || "").toLowerCase().includes(q) ||
          (group.store?.name || "").toLowerCase().includes(q) ||
          group.items.some((line) => (line.item?.name || "").toLowerCase().includes(q))
        )
      }),
    [groupedPurchases, searchTerm, statusFilter, itemId]
  )

  const handleAdd = () => {
    setDialogMode("add")
    setSelectedGroup(undefined)
    setDialogOpen(true)
  }

  const handleView = (group: GroupedPurchase) => {
    setDialogMode("view")
    setSelectedGroup(group)
    setDialogOpen(true)
  }

  const handleDelete = (group: GroupedPurchase) => {
    setGroupToDelete(group)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!groupToDelete) return
    try {
      for (const line of groupToDelete.items) {
        await deletePurchase(line.id)
      }
      setGroupToDelete(null)
      setDeleteDialogOpen(false)
    } catch {
      setGroupToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleSubmit = async (data: any) => {
    if (dialogMode === 'add') {
      toast({
        title: "Adding...",
        description: "Please wait while we add the purchase order",
      });
      
      const amountPaid = data.amountPaid ?? 0;
      const purchaseData = {
        storeId: data.storeId,
        supplierId: data.supplierId,
        referenceNo: data.referenceNo || undefined,
        notes: data.notes || undefined,
        transactionDate: format(data.transactionDate, "yyyy-MM-dd"),
        amountPaid: amountPaid > 0 ? amountPaid : undefined,
        ...(amountPaid > 0 && data.paymentAccountId
          ? { paymentAccountId: data.paymentAccountId }
          : {}),
        items: (data.items || []).map((it: any) => ({
          itemId: it.itemId,
          qtyIn: Number(it.qtyIn),
          inCost: Number(it.inCost),
        })),
      }
      
      try {
        await bulkCreatePurchases(purchaseData);
        toast({
          title: "Success",
          description: "Purchase order added successfully",
        });
      } catch (err) {
        const msg =
          err instanceof Error && err.message.trim()
            ? err.message.trim()
            : "Failed to add purchase order";
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        });
        throw err
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalValue = filteredGroups.reduce(
    (sum, g) => sum + groupedPurchaseTotalCost(g),
    0
  )
  const completedOrders = filteredGroups.filter((g) => g.status === "completed").length
  const pendingOrders = filteredGroups.filter((g) => g.status === "pending").length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Purchase Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your inventory purchase orders and supplier transactions.
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredGroups.length} order{filteredGroups.length !== 1 ? "s" : ""} on this page
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Ready for stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search (client-side only) */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by item, supplier, store, or reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Backend: itemId, supplierId, status, transactionDateFrom/To, page, limit */}
      <div className="flex flex-col xl:flex-row flex-wrap gap-4">
         
          <div className="w-full sm:w-[220px]">
            <Combobox
              value={supplierId}
              onValueChange={setSupplierId}
              options={[
                { value: "", label: "All suppliers" },
                ...suppliers.map((s) => ({ value: s.id, label: s.name })),
              ]}
              placeholder="Supplier"
              searchPlaceholder="Search suppliers..."
            />
          </div>
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
              <SelectValue placeholder="status" />
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
        <div className="text-center py-10 text-muted-foreground">Loading purchase orders…</div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <Card key={group.referenceNo} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-lg truncate">{group.referenceNo || "N/A"}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {group.supplier?.name || "No Supplier"}
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
                        <span className="shrink-0 text-muted-foreground">×{line.qtyIn}</span>
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
                    <p className="font-semibold">{groupedPurchaseTotalQty(group)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Cost</p>
                    <p className="font-semibold">
                      ₦{groupedPurchaseTotalCost(group).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount Paid</p>
                    <p className="font-semibold">
                      ₦{Number(group.amountPaid || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(group)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
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
                <TableHead>Supplier</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total qty</TableHead>
                <TableHead className="text-right">Total cost</TableHead>
                <TableHead className="text-right">Amount paid</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.referenceNo}>
                  <TableCell className="font-medium">{group.referenceNo || "N/A"}</TableCell>
                  <TableCell>{group.supplier?.name || "No Supplier"}</TableCell>
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
                            ×{line.qtyIn}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {groupedPurchaseTotalQty(group)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₦{groupedPurchaseTotalCost(group).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₦{Number(group.amountPaid || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {group.transactionDate
                      ? new Date(group.transactionDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>{getStatusBadge(group.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(group)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(group)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {!isLoading && pagination && (
            <TablePaginationBar
              pagination={pagination}
              totalLabel="Total purchase orders"
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
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No purchase orders found</h3>
          <p className="text-muted-foreground">
            {searchTerm ||
            itemId ||
            supplierId ||
            storeId ||
            statusFilter !== "all" ||
            startDate ||
            endDate
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first purchase order."}
          </p>
          {!searchTerm &&
            !itemId &&
            !supplierId &&
            !storeId &&
            statusFilter === "all" &&
            !startDate &&
            !endDate && (
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Purchase Order
            </Button>
          )}
        </div>
      )}

      <PurchaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        groupedPurchase={selectedGroup}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all line items in this purchase order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}