import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TermForm, type TermFormData } from "@/components/forms/TermForm";
import type { Term } from "@/hooks/useTerms";

interface TermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  term?: Term;
  onSubmit?: (data: TermFormData) => void;
}

export function TermDialog({ open, onOpenChange, mode, term, onSubmit }: TermDialogProps) {
  const handleSubmit = (data: TermFormData) => {
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

  if (mode === "view" && term) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Term Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{term.name}</h3>
                {term.createdAt && (
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(term.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              {getStatusBadge(term.status)}
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
          <DialogTitle>{mode === "add" ? "Create Term" : "Edit Term"}</DialogTitle>
        </DialogHeader>
        <TermForm initialData={term} mode={mode} onSubmit={handleSubmit} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}

