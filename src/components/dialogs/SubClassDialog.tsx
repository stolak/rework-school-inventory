import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SubClassForm, type SubClassFormData } from "@/components/forms/SubClassForm";
import type { SubClass } from "@/hooks/useSubClasses";

interface SubClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  subClass?: SubClass;
  onSubmit?: (data: SubClassFormData) => void;
}

export function SubClassDialog({
  open,
  onOpenChange,
  mode,
  subClass,
  onSubmit,
}: SubClassDialogProps) {
  const handleSubmit = (data: SubClassFormData) => {
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

  if (mode === "view" && subClass) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sub Class Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{subClass.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Class: {subClass.class?.name || "N/A"}
                </p>
              </div>
              {getStatusBadge(subClass.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">
                  {subClass.createdAt ? new Date(subClass.createdAt).toLocaleString() : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Updated</label>
                <p className="text-sm">
                  {subClass.updatedAt ? new Date(subClass.updatedAt).toLocaleString() : "N/A"}
                </p>
              </div>
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
            {mode === "add" ? "Create Sub Class" : "Edit Sub Class"}
          </DialogTitle>
        </DialogHeader>
        <SubClassForm
          initialData={subClass}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}

