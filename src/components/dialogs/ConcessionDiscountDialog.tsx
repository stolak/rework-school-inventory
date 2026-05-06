import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConcessionDiscountForm } from "@/components/forms/ConcessionDiscountForm";
import type {
  ConcessionDiscountCalculationType,
  ConcessionDiscountRow,
  ConcessionDiscountType,
} from "@/hooks/useConcessionDiscounts";
import type { ComboboxOption } from "@/components/ui/combobox";
import type {
  ConcessionDiscountFormData,
} from "@/components/forms/ConcessionDiscountForm";

interface ConcessionDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  discount?: ConcessionDiscountRow;
  billingItemOptions: ComboboxOption[];
  accountOptions: ComboboxOption[];
  onSubmit: (data: ConcessionDiscountFormData) => void | Promise<void>;
}

export function ConcessionDiscountDialog({
  open,
  onOpenChange,
  mode,
  discount,
  billingItemOptions,
  accountOptions,
  onSubmit,
}: ConcessionDiscountDialogProps) {
  const handleSubmit = async (data: ConcessionDiscountFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add concession/discount"}
            {mode === "edit" && "Edit concession/discount"}
          </DialogTitle>
        </DialogHeader>
        <ConcessionDiscountForm
          mode={mode}
          initialData={discount}
          billingItemOptions={billingItemOptions}
          accountOptions={accountOptions}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

