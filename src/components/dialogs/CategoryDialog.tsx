import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { Category } from "@/hooks/useCategories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  category?: Category;
  categories?: Category[];
  onSubmit: (data: any) => void | Promise<void>;
  /** From view mode, switch parent to edit while keeping the same category */
  onRequestEdit?: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
  categories,
  onSubmit,
  onRequestEdit,
}: CategoryDialogProps) {
  const handleSubmit = async (data: any) => {
    try {
      await Promise.resolve(onSubmit(data));
      onOpenChange(false);
    } catch {
      // Parent shows toast; keep dialog open
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add New Category"}
            {mode === "edit" && "Edit Category"}
            {mode === "view" && "Category Details"}
          </DialogTitle>
        </DialogHeader>

        {mode === "view" && category ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-muted-foreground">
                  Category Name
                </h4>
                <p className="text-lg font-semibold">{category.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">Status</h4>
                <Badge
                  variant={
                    category.status === "active" ? "default" : "secondary"
                  }
                >
                  {category.status}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">Description</h4>
              <p>{category.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">Item Count</h4>
              <p>{category.itemCount} items</p>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">
                Created Date
              </h4>
              <p>{category.createdAt}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Close
              </Button>
              {onRequestEdit && (
                <Button type="button" onClick={onRequestEdit}>
                  Edit category
                </Button>
              )}
            </div>
          </div>
        ) : (
          <CategoryForm
            initialData={category}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
