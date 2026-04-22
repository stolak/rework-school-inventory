import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClassDistributionForm } from "@/components/forms/ClassDistributionForm"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface ClassDistributionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit' | 'view'
  distribution?: any
  onSubmit: (data: any) => void
}

export function ClassDistributionDialog({ 
  open, 
  onOpenChange, 
  mode, 
  distribution,
  onSubmit 
}: ClassDistributionDialogProps) {
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
            {mode === 'add' && 'New Class Distribution'}
            {mode === 'edit' && 'Edit Distribution'}
            {mode === 'view' && 'Distribution Details'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'view' && distribution ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{distribution.school_classes?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inventory Item</p>
                <p className="font-medium">{distribution.inventory_items?.name || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Session/Term</p>
                <p className="font-medium">{distribution.academic_session_terms?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity Distributed</p>
                <p className="font-medium text-lg">{distribution.distributed_quantity}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Distribution Date</p>
                <p className="font-medium">
                  {distribution.distribution_date 
                    ? format(new Date(distribution.distribution_date), "PPP")
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receiver</p>
                <p className="font-medium">{distribution.receiver_name || 'N/A'}</p>
              </div>
            </div>

            {distribution.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{distribution.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
                  {distribution.created_at 
                    ? format(new Date(distribution.created_at), "PPp")
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {distribution.updated_at 
                    ? format(new Date(distribution.updated_at), "PPp")
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ClassDistributionForm
            initialData={distribution}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
