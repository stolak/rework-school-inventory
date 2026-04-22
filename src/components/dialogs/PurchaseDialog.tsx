import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PurchaseForm } from "@/components/forms/PurchaseForm"
import type { Transaction } from "@/hooks/useTransactions"

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit' | 'view'
  transaction?: Transaction
  onSubmit: (data: any) => void
}

export function PurchaseDialog({ 
  open, 
  onOpenChange, 
  mode, 
  transaction, 
  onSubmit 
}: PurchaseDialogProps) {
  const handleSubmit = (data: any) => {
    onSubmit(data)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const getTitle = () => {
    switch (mode) {
      case 'add':
        return 'New Purchase Order'
      case 'edit':
        return 'Edit Purchase Order'
      case 'view':
        return 'Purchase Order Details'
      default:
        return 'Purchase Order'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        {mode === 'view' && transaction ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Item</label>
                <p className="text-sm text-muted-foreground">{transaction.itemName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Supplier</label>
                <p className="text-sm text-muted-foreground">{transaction.supplierName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <p className="text-sm text-muted-foreground">{transaction.qty_in}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Cost</label>
                <p className="text-sm text-muted-foreground">₦{transaction.in_cost.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Reference No</label>
                <p className="text-sm text-muted-foreground">{transaction.reference_no || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm text-muted-foreground capitalize">{transaction.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Delivery Person</label>
                <p className="text-sm text-muted-foreground">{transaction.supplier_receiver || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Transaction Date</label>
                <p className="text-sm text-muted-foreground">{transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            {transaction.notes && (
              <div>
                <label className="text-sm font-medium">Notes</label>
                <p className="text-sm text-muted-foreground">{transaction.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <PurchaseForm
            transaction={transaction}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}