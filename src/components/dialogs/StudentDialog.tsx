import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StudentForm } from "@/components/forms/StudentForm"
import { Student } from "@/hooks/useStudents"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface StudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit' | 'view'
  student?: Student
  onSubmit?: (data: any) => void
}

export function StudentDialog({ open, onOpenChange, mode, student, onSubmit }: StudentDialogProps) {
  const handleSubmit = (data: any) => {
    onSubmit?.(data)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "bg-success/10 text-success",
      Inactive: "bg-warning/10 text-warning",
      Graduated: "bg-primary/10 text-primary",
    }

    return (
      <Badge variant="secondary" className={variants[status] ?? "bg-muted text-muted-foreground"}>
        {status}
      </Badge>
    )
  }

  if (mode === 'view' && student) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 bg-gradient-primary">
                <AvatarFallback className="text-primary-foreground font-medium text-lg">
                  {getInitials(student.firstName, student.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{student.firstName} {student.lastName}</h3>
                <p className="text-muted-foreground">{student.admissionNumber}</p>
                {getStatusBadge(student.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Class</label>
                <p className="text-sm font-semibold">{student.className || 'No Class'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <p className="text-sm">{student.gender || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Guardian Name</label>
                <p className="text-sm">{student.guardianName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Guardian Contact</label>
                <p className="text-sm">{student.guardianContact}</p>
              </div>
            </div>

            {(student.guardianEmail || student.studentEmail) && (
              <div className="grid grid-cols-2 gap-4">
                {student.guardianEmail && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Guardian Email</label>
                    <p className="text-sm">{student.guardianEmail}</p>
                  </div>
                )}
                {student.studentEmail && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Student Email</label>
                    <p className="text-sm">{student.studentEmail}</p>
                  </div>
                )}
              </div>
            )}

            {student.dateOfBirth && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <p className="text-sm">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
              </div>
            )}

            {student.address && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-sm">{student.address}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{student.itemsReceived || 0}</p>
                <p className="text-xs text-muted-foreground">Items Received</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">{student.itemsPending || 0}</p>
                <p className="text-xs text-muted-foreground">Items Pending</p>
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
            {mode === 'add' ? 'Add New Student' : 'Edit Student'}
          </DialogTitle>
        </DialogHeader>
        <StudentForm
          initialData={student}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
