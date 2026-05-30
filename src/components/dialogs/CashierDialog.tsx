import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CashierForm } from "@/components/forms/CashierForm";
import type { Cashier } from "@/hooks/useCashiers";
import type { CashierAddFormData, CashierEditFormData } from "@/components/forms/CashierForm";

interface CashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  cashier?: Cashier;
  onSubmit: (data: CashierAddFormData | CashierEditFormData) => void | Promise<void>;
}

export function CashierDialog({
  open,
  onOpenChange,
  mode,
  cashier,
  onSubmit,
}: CashierDialogProps) {
  const handleSubmit = async (data: CashierAddFormData | CashierEditFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add cashier" : "Edit cashier"}
          </DialogTitle>
        </DialogHeader>

        <div key={mode === "edit" ? cashier?.id : "add"}>
          <CashierForm
            mode={mode}
            initialData={cashier}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
