import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PurchaseCreateForm } from "@/components/forms/PurchaseCreateForm"
import { PurchaseEditForm } from "@/components/forms/PurchaseEditForm"
import type { Purchase } from "@/hooks/usePurchases"

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit' | 'view'
  purchase?: Purchase
  onSubmit: (data: any) => Promise<void>
}

export function PurchaseDialog({ 
  open, 
  onOpenChange, 
  mode, 
  purchase, 
  onSubmit 
}: PurchaseDialogProps) {
  const handleSubmit = async (data: any) => {
    await onSubmit(data)
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

  const handleOpenChange = (nextOpen: boolean) => {
    // Prevent closing by outside click / escape; close only via explicit buttons or successful submit.
    if (nextOpen) onOpenChange(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        {mode === 'view' && purchase ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Item</label>
                <p className="text-sm text-muted-foreground">{purchase.item?.name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Supplier</label>
                <p className="text-sm text-muted-foreground">{purchase.supplier?.name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <p className="text-sm text-muted-foreground">{purchase.qtyIn}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Cost</label>
                <p className="text-sm text-muted-foreground">₦{Number(purchase.inCost || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Reference No</label>
                <p className="text-sm text-muted-foreground">{purchase.referenceNo || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm text-muted-foreground capitalize">{purchase.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Delivery Person</label>
                <p className="text-sm text-muted-foreground">N/A</p>
              </div>
              <div>
                <label className="text-sm font-medium">Transaction Date</label>
                <p className="text-sm text-muted-foreground">{purchase.transactionDate ? new Date(purchase.transactionDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            {purchase.notes && (
              <div>
                <label className="text-sm font-medium">Notes</label>
                <p className="text-sm text-muted-foreground">{purchase.notes}</p>
              </div>
            )}
          </div>
        ) : mode === "add" ? (
          <PurchaseCreateForm onSubmit={handleSubmit} onCancel={handleCancel} />
        ) : (
          <PurchaseEditForm
            purchase={purchase}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}