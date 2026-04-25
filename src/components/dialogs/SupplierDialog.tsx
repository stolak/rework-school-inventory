import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SupplierForm } from "@/components/forms/SupplierForm"
import { Supplier } from "@/hooks/useSuppliers"
import { Badge } from "@/components/ui/badge"

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit' | 'view'
  supplier?: Supplier
  onSubmit: (data: any) => void
}

export function SupplierDialog({ open, onOpenChange, mode, supplier, onSubmit }: SupplierDialogProps) {
  const handleSubmit = (data: any) => {
    onSubmit(data)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' && 'Add New Supplier'}
            {mode === 'edit' && 'Edit Supplier'}
            {mode === 'view' && 'Supplier Details'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'view' && supplier ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-muted-foreground">Supplier Name</h4>
                <p className="text-lg font-semibold">{supplier.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">Contact Name</h4>
                <p>{supplier.contactName || '-'}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">Email</h4>
                <p>{supplier.email || '-'}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">Phone</h4>
                <p>{supplier.phone || '-'}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-muted-foreground">Address</h4>
              <p>{supplier.address || '-'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-muted-foreground">City</h4>
                <p>{supplier.city || '-'}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">State</h4>
                <p>{supplier.state || '-'}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">Country</h4>
                <p>{supplier.country || '-'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">Website</h4>
              <p>{supplier.website ? <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{supplier.website}</a> : '-'}</p>
            </div>

            {supplier.notes && (
              <div>
                <h4 className="font-medium text-muted-foreground">Notes</h4>
                <p className="whitespace-pre-wrap">{supplier.notes}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-muted-foreground">Created Date</h4>
              <p>{supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        ) : (
          <SupplierForm
            initialData={supplier}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}