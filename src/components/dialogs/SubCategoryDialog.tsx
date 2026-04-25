import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubCategoryForm } from "@/components/forms/SubCategoryForm";
import { SubCategory } from "@/hooks/useSubCategories";

interface SubCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subCategory?: SubCategory;
  mode: "add" | "edit" | "view";
  onSubmit: (data: any) => void;
}

export function SubCategoryDialog({
  open,
  onOpenChange,
  subCategory,
  mode,
  onSubmit,
}: SubCategoryDialogProps) {
  const handleSubmit = (data: any) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? "Add Sub-Category"
              : mode === "edit"
              ? "Edit Sub-Category"
              : "View Sub-Category"}
          </DialogTitle>
        </DialogHeader>

        {mode === "view" && subCategory ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{subCategory.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Category</p>
              <p className="text-sm text-muted-foreground">
                {subCategory.category?.name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">
                {subCategory.description || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Created At</p>
              <p className="text-sm text-muted-foreground">
                {subCategory.createdAt}
              </p>
            </div>
          </div>
        ) : (
          <SubCategoryForm
            subCategory={subCategory}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
