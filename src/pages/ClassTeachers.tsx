import { Users, Plus, Search, Edit, Eye, Trash2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useClassTeachers } from "@/hooks/useClassTeachers";
import { ClassTeacherDialog } from "@/components/dialogs/ClassTeacherDialog";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClassTeachers() {
  const { classTeachers, addClassTeacher, updateClassTeacher, deleteClassTeacher, isLoading } = useClassTeachers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-success/10 text-success",
      inactive: "bg-warning/10 text-warning",
      archived: "bg-secondary/10 text-secondary"
    };
    
    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      class_teacher: "bg-primary/10 text-primary",
      assistant_teacher: "bg-blue-500/10 text-blue-600",
      subject_teacher: "bg-purple-500/10 text-purple-600"
    };
    
    return (
      <Badge variant="secondary" className={variants[role as keyof typeof variants]}>
        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAdd = () => {
    setDialogMode('add');
    setSelectedTeacher(null);
    setDialogOpen(true);
  };

  const handleEdit = (teacher: any) => {
    setDialogMode('edit');
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  const handleView = (teacher: any) => {
    setDialogMode('view');
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTeacherToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (teacherToDelete) {
      try {
        await deleteClassTeacher(teacherToDelete);
        setTeacherToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setTeacherToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === 'add') {
      try {
        await addClassTeacher(data);
      } catch (err) {
        // Error is already handled in the hook
      }
    } else if (dialogMode === 'edit') {
      try {
        await updateClassTeacher(selectedTeacher.id, data);
      } catch (err) {
        // Error is already handled in the hook
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            Class Teachers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage class teacher assignments and roles
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Teacher
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search teachers..." 
            className="pl-10"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classTeachers.map((teacher) => (
            <Card key={teacher.id} className="shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 bg-gradient-primary">
                    <AvatarFallback className="text-primary-foreground font-medium">
                      {getInitials(teacher.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {teacher.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {teacher.email}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(teacher.status)}
                        {getRoleBadge(teacher.role)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {teacher.class_id === "none" || !teacher.class_id || !teacher.className 
                      ? "No class assigned" 
                      : teacher.className}
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Assigned: {new Date(teacher.assigned_at).toLocaleDateString()}
                  </p>
                  {teacher.unassigned_at && (
                    <p className="text-xs text-muted-foreground">
                      Unassigned: {new Date(teacher.unassigned_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleView(teacher)}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(teacher)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(teacher.id)}
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
          Load More Teachers
        </Button>
      </div>

      <ClassTeacherDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        teacher={selectedTeacher}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the
              teacher assignment and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
