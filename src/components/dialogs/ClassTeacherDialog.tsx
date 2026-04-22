import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClassTeacherForm } from "@/components/forms/ClassTeacherForm";
import { ClassTeacher } from "@/hooks/useClassTeachers";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, GraduationCap } from "lucide-react";

interface ClassTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit' | 'view';
  teacher?: ClassTeacher;
  onSubmit?: (data: any) => void;
}

export function ClassTeacherDialog({ open, onOpenChange, mode, teacher, onSubmit }: ClassTeacherDialogProps) {
  const handleSubmit = (data: any) => {
    onSubmit?.(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  if (mode === 'view' && teacher) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 bg-gradient-primary">
                <AvatarFallback className="text-primary-foreground font-medium text-lg">
                  {getInitials(teacher.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{teacher.name}</h3>
                <p className="text-muted-foreground">{teacher.email}</p>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(teacher.status)}
                  {getRoleBadge(teacher.role)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Class</label>
                <p className="text-sm font-semibold">
                  {teacher.class_id === "none" || !teacher.class_id || !teacher.className 
                    ? "No class assigned" 
                    : teacher.className}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{teacher.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assigned At</label>
                <p className="text-sm">{new Date(teacher.assigned_at).toLocaleDateString()}</p>
              </div>
              {teacher.unassigned_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unassigned At</label>
                  <p className="text-sm">{new Date(teacher.unassigned_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}
          </DialogTitle>
        </DialogHeader>
        <ClassTeacherForm
          initialData={teacher}
          {...(mode !== 'view' && { mode })}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
