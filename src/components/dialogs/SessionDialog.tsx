import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SessionForm } from "@/components/forms/SessionForm";
import type { Session } from "@/components/forms/SessionForm";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { BookOpen } from "lucide-react";

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  session?: Session;
  onSubmit?: (data: any) => void;
}

export function SessionDialog({ open, onOpenChange, mode, session, onSubmit }: SessionDialogProps) {
  const handleSubmit = (data: any) => {
    onSubmit?.(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-success/10 text-success",
      inactive: "bg-warning/10 text-warning",
      archived: "bg-muted/10 text-muted-foreground",
    };

    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDisplayName = (session: Session) => {
    return `${session.session} - ${session.name}`;
  };

  if (mode === "view" && session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{getDisplayName(session)}</h3>
                <p className="text-muted-foreground">
                  {new Date(session.start_date).toLocaleDateString()} -{" "}
                  {new Date(session.end_date).toLocaleDateString()}
                </p>
                {getStatusBadge(session.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Academic Session</label>
                <p className="text-sm font-semibold">{session.session}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Term Name</label>
                <p className="text-sm font-semibold">{session.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <p className="text-sm">{new Date(session.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">End Date</label>
                <p className="text-sm">{new Date(session.end_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{session.totalClasses || 0}</p>
                <p className="text-xs text-muted-foreground">Total Classes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{session.totalStudents || 0}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>

            {session.created_at && (
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm">{new Date(session.created_at).toLocaleDateString()}</p>
              </div>
            )}
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
            {mode === "add" ? "Add New Session" : "Edit Session"}
          </DialogTitle>
        </DialogHeader>
        <SessionForm
          initialData={session}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}