import { GraduationCap, Plus, Users, BookOpen, CheckCircle, Edit, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useClasses } from "@/hooks/useClasses"
import { ClassDialog } from "@/components/dialogs/ClassDialog"
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

export default function Classes() {
  const { classes, addClass, updateClass, deleteClass } = useClasses()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<string | null>(null)

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-success"
    if (progress >= 70) return "bg-primary"
    if (progress >= 50) return "bg-warning"
    return "bg-destructive"
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

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedClass(null)
    setDialogOpen(true)
  }

  const handleEdit = (classItem: any) => {
    setDialogMode('edit')
    setSelectedClass(classItem)
    setDialogOpen(true)
  }

  const handleView = (classItem: any) => {
    setDialogMode('view')
    setSelectedClass(classItem)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setClassToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (classToDelete) {
      try {
        await deleteClass(classToDelete);
        setClassToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setClassToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === 'add') {
      await addClass(data);
    } else if (dialogMode === 'edit') {
      await updateClass(selectedClass.id, data);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Class Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage classes and track inventory distributions
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Class
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">324</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-warning/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Pending Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">78%</p>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="shadow-card hover:shadow-elevated transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold mb-1">{classItem.name}</CardTitle>
                </div>
                {getStatusBadge(classItem.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Distribution Progress</span>
                  <span className="font-medium">{classItem.distributionProgress}%</span>
                </div>
                <Progress 
                  value={classItem.distributionProgress} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {classItem.distributedItems} of {classItem.totalItems} items distributed
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleView(classItem)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEdit(classItem)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(classItem.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ClassDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        classItem={selectedClass}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              class and all associated data including students and entitlements.
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