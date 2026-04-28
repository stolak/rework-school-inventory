import { Users, Plus, Search, GraduationCap, Edit, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useStudents } from "@/hooks/useStudents"
import { StudentDialog } from "@/components/dialogs/StudentDialog"
import { useState } from "react"
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

export default function Students() {
  const { students, addStudent, updateStudent, deleteStudent, isLoading } = useStudents({
    page: 1,
    limit: 20,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
  }

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedStudent(null)
    setDialogOpen(true)
  }

  const handleEdit = (student: any) => {
    setDialogMode('edit')
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const handleView = (student: any) => {
    setDialogMode('view')
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      try {
        await deleteStudent(studentToDelete);
        setStudentToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setStudentToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === 'add') {
      try {
        const { status: _omitStatus, ...createPayload } = data
        await addStudent(createPayload)
      } catch (err) {
        // Error is already handled in the hook
      }
    } else if (dialogMode === 'edit' && selectedStudent) {
      try {
        await updateStudent(selectedStudent.id, data)
      } catch (err) {
        // Error is already handled in the hook
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            Student Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage student records and track inventory distributions
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Student
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-10"
          />
        </div>
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
          <Card key={student.id} className="shadow-card hover:shadow-elevated transition-all duration-300">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 bg-gradient-primary">
                  <AvatarFallback className="text-primary-foreground font-medium">
                    {getInitials(student.firstName, student.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {student.admissionNumber}
                      </p>
                    </div>
                    {getStatusBadge(student.status)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{student.className || 'No Class'}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Guardian</p>
                <p className="font-medium">{student.guardianName}</p>
                <p className="text-sm text-muted-foreground">{student.guardianContact}</p>
                {student.guardianEmail && (
                  <p className="text-sm text-muted-foreground">{student.guardianEmail}</p>
                )}
              </div>

              {student.studentEmail && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Student Email</p>
                  <p className="text-sm font-medium">{student.studentEmail}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{student.itemsReceived || 0}</p>
                  <p className="text-xs text-muted-foreground">Items Received</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{student.itemsPending || 0}</p>
                  <p className="text-xs text-muted-foreground">Items Pending</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleView(student)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEdit(student)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(student.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">
          Load More Students
        </Button>
      </div>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        student={selectedStudent}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              student and all associated data.
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