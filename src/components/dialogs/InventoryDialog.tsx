import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InventoryForm } from "@/components/forms/InventoryForm"
import { InventoryItem } from "@/hooks/useInventory"

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit' | 'view'
  item?: InventoryItem
  onSubmit?: (data: any) => void
}

export function InventoryDialog({ open, onOpenChange, mode, item, onSubmit }: InventoryDialogProps) {
  const handleSubmit = (data: any) => {
    onSubmit?.(data)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (mode === 'view' && item) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventory Item Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item Name</label>
                <p className="text-sm font-semibold">{item.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                <p className="text-sm">{item.sku || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-sm">{item.categories?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sub-Category</label>
                <p className="text-sm">{item.sub_categories?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                <p className="text-sm">{item.brands?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Unit of Measurement</label>
                <p className="text-sm">{item.uoms ? `${item.uoms.name} (${item.uoms.symbol})` : 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                <p className="text-sm font-semibold">{item.current_stock} units</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Low Stock Threshold</label>
                <p className="text-sm">{item.low_stock_threshold} units</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cost Price</label>
                <p className="text-sm">₦{Number(item.cost_price).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Selling Price</label>
                <p className="text-sm font-semibold">₦{Number(item.selling_price).toLocaleString()}</p>
              </div>
            </div>
            {item.barcode && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Barcode</label>
                <p className="text-sm">{item.barcode}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Inventory Item' : 'Edit Inventory Item'}
          </DialogTitle>
        </DialogHeader>
        <InventoryForm
          initialData={item}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}