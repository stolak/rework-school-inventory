import { useState } from "react"
import { Plus, Search, Eye, Edit, Trash2, Filter, ShoppingBag, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { SaleDialog } from "@/components/dialogs/SaleDialog"
import { useTransactions, type Transaction } from "@/hooks/useTransactions"
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

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)

  // Build query parameters for API call
  const queryParams = {
    transaction_type: "sale" as const,
    from_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
    to_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
  }

  const { saleTransactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions(queryParams)
  const { toast } = useToast()

  // Client-side filtering for search term and status (since API doesn't support these)
  const filteredTransactions = saleTransactions.filter((transaction) => {
    const matchesSearch = 
      transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.supplier_receiver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference_no && transaction.reference_no.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedTransaction(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (transaction: Transaction) => {
    setDialogMode('edit')
    setSelectedTransaction(transaction)
    setDialogOpen(true)
  }

  const handleView = (transaction: Transaction) => {
    setDialogMode('view')
    setSelectedTransaction(transaction)
    setDialogOpen(true)
  }

  const handleDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete.id);
        setTransactionToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setTransactionToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === 'add') {
      toast({
        title: "Adding...",
        description: "Please wait while we add the sale transaction",
      });
      
      const transactionData = {
        item_id: data.item_id,
        transaction_type: 'sale' as const,
        qty_in: 0,
        in_cost: 0,
        qty_out: data.qty_out,
        out_cost: data.out_cost,
        status: data.status,
        reference_no: data.reference_no || undefined,
        notes: data.notes || undefined,
        supplier_receiver: data.customer_name,
        transaction_date: data.transaction_date.toISOString(),
      }
      
      try {
        await addTransaction(transactionData);
        toast({
          title: "Success",
          description: "Sale transaction added successfully",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to add sale transaction",
          variant: "destructive",
        });
      }
    } else if (dialogMode === 'edit' && selectedTransaction) {
      toast({
        title: "Updating...",
        description: "Please wait while we update the sale transaction",
      });
      
      const updateData = {
        item_id: data.item_id,
        qty_out: data.qty_out,
        out_cost: data.out_cost,
        status: data.status,
        reference_no: data.reference_no || undefined,
        notes: data.notes || undefined,
        supplier_receiver: data.customer_name,
        transaction_date: data.transaction_date.toISOString(),
      }
      
      try {
        await updateTransaction(selectedTransaction.id, updateData);
        toast({
          title: "Success",
          description: "Sale transaction updated successfully",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to update sale transaction",
          variant: "destructive",
        });
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

  const totalValue = filteredTransactions.reduce((sum, t) => sum + (t.out_cost || 0), 0)
  const completedSales = filteredTransactions.filter(t => t.status === 'completed').length
  const pendingSales = filteredTransactions.filter(t => t.status === 'pending').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            Sales Transactions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your inventory sales transactions and customer orders.
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          New Sale Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.length} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedSales}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingSales}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by item or reference number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Date Range Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[240px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Start date"}
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
              variant="outline"
              className={cn(
                "w-full sm:w-[240px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "End date"}
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
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-md">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Transactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{transaction.itemName}</CardTitle>
                  <p className="text-sm text-muted-foreground">customer: {transaction?.supplier_receiver||'N/A'}</p>
                  
                </div>
                {getStatusBadge(transaction.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-semibold">{transaction.qty_out || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Revenue</p>
                  <p className="font-semibold">₦{(transaction.out_cost || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-semibold">{transaction.reference_no || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {transaction.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="text-foreground line-clamp-2">{transaction.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(transaction)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(transaction)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(transaction)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-10">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No sales transactions found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all" || startDate || endDate
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first sale transaction."
            }
          </p>
          {!searchTerm && statusFilter === "all" && !startDate && !endDate && (
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Sale Transaction
            </Button>
          )}
        </div>
      )}

      <SaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        transaction={selectedTransaction}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              sale transaction and all associated data.
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
