import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrandForm } from "@/components/forms/BrandForm";
import { Brand } from "@/hooks/useBrands";

interface BrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  brand?: Brand;
  onSubmit: (data: any) => void;
}

export function BrandDialog({
  open,
  onOpenChange,
  mode,
  brand,
  onSubmit,
}: BrandDialogProps) {
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
            {mode === "add" && "Add New Brand"}
            {mode === "edit" && "Edit Brand"}
            {mode === "view" && "Brand Details"}
          </DialogTitle>
        </DialogHeader>

        {mode === "view" && brand ? (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-muted-foreground">Brand Name</h4>
              <p className="text-lg font-semibold">{brand.name}</p>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">
                Created Date
              </h4>
              <p>{brand.createdAt}</p>
            </div>
          </div>
        ) : (
          <BrandForm
            initialData={brand}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
