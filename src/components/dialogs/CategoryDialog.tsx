import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm, type CategoryFormSubmitData } from "@/components/forms/CategoryForm";
import { Category } from "@/hooks/useCategories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit" | "view";
  category?: Category;
  onSubmit: (data: CategoryFormSubmitData) => void | Promise<void>;
  onRequestEdit?: () => void;
}

function categoryTypeLabel(type: Category["categoryType"]): string {
  return type === "NonConsumable" ? "Non-consumable" : "Consumable";
}

function consumableAccountDisplay(category: Category): string {
  if (!category.consumableAccount) {
    return category.consumableAccountId != null
      ? `Account #${category.consumableAccountId}`
      : "—";
  }
  const no = category.consumableAccount.accountNo?.trim();
  return no
    ? `${no} — ${category.consumableAccount.accountDescription}`
    : category.consumableAccount.accountDescription;
}

function assetAccountDisplay(category: Category): string {
  const asset = (category as any).assetAccount as
    | { id: number; accountNo?: string | null; accountDescription: string }
    | null
    | undefined;
  const assetId = (category as any).assetAccountId as number | null | undefined;

  if (!asset) {
    return assetId != null ? `Account #${assetId}` : "—";
  }
  const no = asset.accountNo?.trim();
  return no ? `${no} — ${asset.accountDescription}` : asset.accountDescription;
}

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
  onSubmit,
  onRequestEdit,
}: CategoryDialogProps) {
  const handleSubmit = async (data: CategoryFormSubmitData) => {
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
            {mode === "add" && "Add new category"}
            {mode === "edit" && "Edit category"}
            {mode === "view" && "Category details"}
          </DialogTitle>
        </DialogHeader>

        {mode === "view" && category ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-muted-foreground">Category name</h4>
                <p className="text-lg font-semibold">{category.name}</p>
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">Status</h4>
                <Badge variant={category.status === "active" ? "default" : "secondary"}>
                  {category.status}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">Category type</h4>
              <Badge variant="outline">{categoryTypeLabel(category.categoryType)}</Badge>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">Description</h4>
              <p>{category.description || "—"}</p>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">Asset GL account</h4>
              <p>{assetAccountDisplay(category)}</p>
            </div>

            <div>
              <h4 className="font-medium text-muted-foreground">Expense GL account</h4>
              <p>{consumableAccountDisplay(category)}</p>
            </div>

            {category.itemCount > 0 ? (
              <div>
                <h4 className="font-medium text-muted-foreground">Item count</h4>
                <p>{category.itemCount} items</p>
              </div>
            ) : null}

            <div>
              <h4 className="font-medium text-muted-foreground">Created</h4>
              <p>{category.createdAt}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Close
              </Button>
              {onRequestEdit ? (
                <Button type="button" onClick={onRequestEdit}>
                  Edit category
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <CategoryForm
            isEdit={mode === "edit"}
            initialData={category}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
