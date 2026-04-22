import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClassForm } from "@/components/forms/ClassForm"
import { SchoolClass } from "@/hooks/useClasses"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit' | 'view'
  classItem?: SchoolClass
  onSubmit?: (data: any) => void
}

export function ClassDialog({ open, onOpenChange, mode, classItem, onSubmit }: ClassDialogProps) {
  const handleSubmit = (data: any) => {
    onSubmit?.(data)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-success/10 text-success",
      inactive: "bg-warning/10 text-warning",
      archived: "bg-muted text-muted-foreground"
    }
    
    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (mode === 'view' && classItem) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Class Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{classItem.name}</h3>
              </div>
              {getStatusBadge(classItem.status)}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Distribution Progress</span>
                <span className="font-medium">{classItem.distributionProgress}%</span>
              </div>
              <Progress value={classItem.distributionProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {classItem.distributedItems} of {classItem.totalItems} items distributed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Items</label>
                <p className="text-lg font-semibold">{classItem.totalItems}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Items Distributed</label>
                <p className="text-lg font-semibold text-success">{classItem.distributedItems}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Class' : 'Edit Class'}
          </DialogTitle>
        </DialogHeader>
        <ClassForm
          initialData={classItem}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}