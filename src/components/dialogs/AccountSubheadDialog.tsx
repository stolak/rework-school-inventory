import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountSubheadForm } from "@/components/forms/AccountSubheadForm";
import type { AccountSubhead } from "@/hooks/useAccountSubheads";
import type {
  AccountSubheadAddFormData,
  AccountSubheadEditFormData,
} from "@/components/forms/AccountSubheadForm";

interface AccountSubheadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  subhead?: AccountSubhead;
  headLabel?: string;
  onSubmit: (
    data: AccountSubheadAddFormData | AccountSubheadEditFormData
  ) => void | Promise<void>;
}

export function AccountSubheadDialog({
  open,
  onOpenChange,
  mode,
  subhead,
  headLabel,
  onSubmit,
}: AccountSubheadDialogProps) {
  const handleSubmit = async (
    data: AccountSubheadAddFormData | AccountSubheadEditFormData
  ) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add account subhead"}
            {mode === "edit" && "Edit account subhead"}
          </DialogTitle>
          {headLabel && mode === "add" && (
            <p className="text-sm text-muted-foreground">
              Account head: {headLabel}
            </p>
          )}
        </DialogHeader>

        <div key={mode === "edit" ? subhead?.id : "add"}>
          <AccountSubheadForm
            mode={mode}
            initialData={subhead}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
