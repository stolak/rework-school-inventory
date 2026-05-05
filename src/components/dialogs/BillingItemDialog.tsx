import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BillingItemForm } from "@/components/forms/BillingItemForm";
import type { BillingItem } from "@/lib/api";
import type { ComboboxOption } from "@/components/ui/combobox";
import type {
  BillingItemAddFormData,
  BillingItemEditFormData,
} from "@/components/forms/BillingItemForm";

interface BillingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  billingItem?: BillingItem;
  categoryOptions: ComboboxOption[];
  accountOptions: ComboboxOption[];
  onSubmit: (
    data: BillingItemAddFormData | BillingItemEditFormData
  ) => void | Promise<void>;
}

export function BillingItemDialog({
  open,
  onOpenChange,
  mode,
  billingItem,
  categoryOptions,
  accountOptions,
  onSubmit,
}: BillingItemDialogProps) {
  const handleSubmit = async (
    data: BillingItemAddFormData | BillingItemEditFormData
  ) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add billing item"}
            {mode === "edit" && "Edit billing item"}
          </DialogTitle>
        </DialogHeader>
        <div key={mode === "edit" ? billingItem?.id : "add"}>
          <BillingItemForm
            mode={mode}
            initialData={billingItem}
            categoryOptions={categoryOptions}
            accountOptions={accountOptions}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

