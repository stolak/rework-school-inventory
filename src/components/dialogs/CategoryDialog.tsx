import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { Category } from "@/hooks/useCategories";
import { Badge } from "@/components/ui/badge";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  category?: Category;
  categories?: Category[];
  onSubmit: (data: any) => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
  categories,
  onSubmit,
}: CategoryDialogProps) {
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
