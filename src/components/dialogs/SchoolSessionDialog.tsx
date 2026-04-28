import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SchoolSessionForm, type SchoolSessionFormData } from "@/components/forms/SchoolSessionForm";
import type { SchoolSession } from "@/hooks/useSchoolSessions";

interface SchoolSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  session?: SchoolSession;
  onSubmit?: (data: SchoolSessionFormData) => void;
}

export function SchoolSessionDialog({
  open,
  onOpenChange,
  mode,
  session,
  onSubmit,
}: SchoolSessionDialogProps) {
  const handleSubmit = (data: SchoolSessionFormData) => {
    onSubmit?.(data);
    onOpenChange(false);
  };

  const handleCancel = () => onOpenChange(false);

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, string> = {
      Active: "bg-success/10 text-success",
      Inactive: "bg-warning/10 text-warning",
    };
    const s = status || "N/A";
    return (
      <Badge variant="secondary" className={variants[s] ?? "bg-muted text-muted-foreground"}>
        {s}
      </Badge>
    );
  };

  if (mode === "view" && session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{session.name}</h3>
                {session.createdAt && (
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(session.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              {getStatusBadge(session.status)}
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
            {mode === "add" ? "Create Session" : "Edit Session"}
          </DialogTitle>
        </DialogHeader>
        <SchoolSessionForm
          initialData={session}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}

