import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses } from "@/hooks/useClasses";
import { useSubClasses } from "@/hooks/useSubClasses";
import { STUDENT_STATUSES } from "@/lib/studentConstants";

export type StudentBulkMovePayload = {
  studentIds: string[];
  classId?: string;
  subClassId?: string;
  status?: string;
};

interface StudentBulkMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  studentIds: string[];
  onSubmit: (payload: StudentBulkMovePayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function StudentBulkMoveDialog({
  open,
  onOpenChange,
  selectedCount,
  studentIds,
  onSubmit,
  isSubmitting = false,
}: StudentBulkMoveDialogProps) {
  const [classId, setClassId] = useState("");
  const [subClassId, setSubClassId] = useState("");
  const [status, setStatus] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { classes } = useClasses({ page: 1, limit: 100 });
  const { subClasses } = useSubClasses({ page: 1, limit: 500 });

  const subClassOptions = useMemo(() => {
    if (!classId) return [];
    return subClasses.filter((sc) => sc.classId === classId);
  }, [subClasses, classId]);

  useEffect(() => {
    if (!open) {
      setClassId("");
      setSubClassId("");
      setStatus("");
      setFormError(null);
    }
  }, [open]);

  useEffect(() => {
    setSubClassId("");
  }, [classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const hasClass = Boolean(classId);
    const hasSubClass = Boolean(subClassId);
    const hasStatus = Boolean(status);

    if (!hasClass && !hasSubClass && !hasStatus) {
      setFormError("Select at least one of class, sub class, or status to update.");
      return;
    }

    if (hasSubClass && !hasClass) {
      setFormError("Select a class before choosing a sub class.");
      return;
    }

    try {
      await onSubmit({
        studentIds,
        ...(hasClass ? { classId } : {}),
        ...(hasSubClass ? { subClassId } : {}),
        ...(hasStatus ? { status } : {}),
      });
      onOpenChange(false);
    } catch {
      // Parent shows toast; keep dialog open
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move students</DialogTitle>
          <DialogDescription>
            Update class, sub class, and/or status for {selectedCount} selected student
            {selectedCount !== 1 ? "s" : ""}. Leave a field unchanged by keeping it as
            &quot;No change&quot;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Combobox
              value={classId}
              onValueChange={setClassId}
              options={[
                { value: "", label: "No change" },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
              placeholder="No change"
              searchPlaceholder="Search classes…"
            />
          </div>

          <div className="space-y-2">
            <Label>Sub class</Label>
            <Combobox
              value={subClassId}
              onValueChange={setSubClassId}
              options={[
                { value: "", label: "No change" },
                ...subClassOptions.map((sc) => ({
                  value: sc.id,
                  label: sc.name,
                })),
              ]}
              placeholder="No change"
              searchPlaceholder="Search sub classes…"
              disabled={!classId}
            />
            {!classId ? (
              <p className="text-xs text-muted-foreground">
                Select a class to change sub class.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status || "none"}
              onValueChange={(v) => setStatus(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No change" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No change</SelectItem>
                {STUDENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Apply changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
