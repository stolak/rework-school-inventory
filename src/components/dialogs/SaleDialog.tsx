import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SaleForm } from "@/components/forms/SaleForm"
import type { Transaction } from "@/hooks/useTransactions"

interface SaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit' | 'view'
  transaction?: Transaction
  onSubmit: (data: any) => void
}

export function SaleDialog({ 
  open, 
  onOpenChange, 
  mode, 
  transaction, 
  onSubmit 
}: SaleDialogProps) {
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
        return 'New Sale Transaction'
      case 'edit':
        return 'Edit Sale Transaction'
      case 'view':
        return 'Sale Transaction Details'
      default:
        return 'Sale Transaction'
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
                <label className="text-sm font-medium">Customer</label>
                <p className="text-sm text-muted-foreground">{transaction.receiver_id || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <p className="text-sm text-muted-foreground">{transaction.qty_out || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Revenue</label>
                <p className="text-sm text-muted-foreground">₦{(transaction.out_cost || 0).toLocaleString()}</p>
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
                <label className="text-sm font-medium">Transaction Date</label>
                <p className="text-sm text-muted-foreground">{transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Transaction Type</label>
                <p className="text-sm text-muted-foreground capitalize">{transaction.transaction_type}</p>
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
          <SaleForm
            transaction={transaction}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
