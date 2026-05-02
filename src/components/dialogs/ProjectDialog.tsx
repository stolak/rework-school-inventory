import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ProjectForm, type ProjectFormData } from "@/components/forms/ProjectForm";
import type { ProjectRow } from "@/hooks/useProjects";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  project?: ProjectRow;
  onSubmit?: (data: ProjectFormData) => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  mode,
  project,
  onSubmit,
}: ProjectDialogProps) {
  const handleSubmit = (data: ProjectFormData) => {
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

  if (mode === "view" && project) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{project.name}</h3>
                {project.createdAt && (
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(project.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              {getStatusBadge(project.status)}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm whitespace-pre-wrap">
                {project.description?.trim() ? project.description : "—"}
              </p>
            </div>
            {project.creatorDisplayName && (
              <p className="text-sm text-muted-foreground">
                Created by: {project.creatorDisplayName}
              </p>
            )}
            {project.transactionCount !== undefined && (
              <p className="text-sm text-muted-foreground">
                Inventory transactions: {project.transactionCount}
              </p>
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
          <DialogTitle>{mode === "add" ? "Create project" : "Edit project"}</DialogTitle>
        </DialogHeader>
        <ProjectForm
          initialData={project}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
