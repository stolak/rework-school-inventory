import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountChartForm } from "@/components/forms/AccountChartForm";
import type { AccountChart } from "@/hooks/useAccountCharts";
import type { ComboboxOption } from "@/components/ui/combobox";
import type {
  AccountChartAddFormData,
  AccountChartEditFormData,
} from "@/components/forms/AccountChartForm";

interface AccountChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  chart?: AccountChart;
  subheadOptions: ComboboxOption[];
  onSubmit: (
    data: AccountChartAddFormData | AccountChartEditFormData
  ) => void | Promise<void>;
}

export function AccountChartDialog({
  open,
  onOpenChange,
  mode,
  chart,
  subheadOptions,
  onSubmit,
}: AccountChartDialogProps) {
  const handleSubmit = async (
    data: AccountChartAddFormData | AccountChartEditFormData
  ) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add account chart"}
            {mode === "edit" && "Edit account chart"}
          </DialogTitle>
        </DialogHeader>
        <div key={mode === "edit" ? chart?.id : "add"}>
          <AccountChartForm
            mode={mode}
            subheadOptions={subheadOptions}
            initialData={chart}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
