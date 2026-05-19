import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FacilityForm, type FacilityFormSubmitData } from "@/components/forms/FacilityForm";
import { Facility } from "@/hooks/useFacilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FacilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  facility?: Facility;
  onSubmit: (data: FacilityFormSubmitData) => void | Promise<void>;
  onRequestEdit?: () => void;
}

export function FacilityDialog({
  open,
  onOpenChange,
  mode,
  facility,
  onSubmit,
  onRequestEdit,
}: FacilityDialogProps) {
  const handleSubmit = async (data: FacilityFormSubmitData) => {
    try {
      await Promise.resolve(onSubmit(data));
      onOpenChange(false);
    } catch {
      // Parent shows toast; keep dialog open
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add facility"}
            {mode === "edit" && "Edit facility"}
            {mode === "view" && "Facility details"}
          </DialogTitle>
        </DialogHeader>

        {mode === "view" && facility ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-muted-foreground">Facility name</h4>
                <p className="text-lg font-semibold">{facility.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">Status</h4>
                <Badge variant={facility.status === "active" ? "default" : "secondary"}>
                  {facility.status}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">Description</h4>
              <p>{facility.description || "—"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-muted-foreground">Created by</h4>
                <p>{facility.createdByName}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">Inventory transactions</h4>
                <p>{facility.transactionCount}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">Created</h4>
              <p>{facility.createdAt}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onRequestEdit ? (
                <Button type="button" onClick={onRequestEdit}>
                  Edit facility
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <FacilityForm
            isEdit={mode === "edit"}
            initialData={facility}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
