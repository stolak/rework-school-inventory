import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UomForm } from "@/components/forms/UomForm";
import { Uom } from "@/hooks/useUoms";

interface UomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  uom?: Uom;
  onSubmit: (data: any) => void;
}

export function UomDialog({
  open,
  onOpenChange,
  mode,
  uom,
  onSubmit,
}: UomDialogProps) {
  const handleSubmit = (data: any) => {
    onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add New Unit of Measurement"}
            {mode === "edit" && "Edit Unit of Measurement"}
            {mode === "view" && "Unit of Measurement Details"}
          </DialogTitle>
        </DialogHeader>

        {mode === "view" && uom ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-muted-foreground">Name</h4>
                <p className="text-lg font-semibold">{uom.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">Symbol</h4>
                <p className="text-lg font-semibold">{uom.symbol}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">
                Created Date
              </h4>
              <p>{uom.createdAt}</p>
            </div>
          </div>
        ) : (
          <UomForm
            initialData={uom}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
