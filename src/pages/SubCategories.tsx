import { useState } from "react";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubCategoryDialog } from "@/components/dialogs/SubCategoryDialog";
import { useSubCategories, SubCategory } from "@/hooks/useSubCategories";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SubCategories() {
  const {
    subCategories,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
  } = useSubCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedSubCategory, setSelectedSubCategory] = useState<
    SubCategory | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<string | null>(
    null
  );

  const filteredSubCategories = subCategories.filter(
    (subCategory) =>
      subCategory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subCategory.categoryName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedSubCategory(undefined);
    setDialogMode("add");
    setDialogOpen(true);
  };

  const handleEdit = (subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleView = (subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
    setDialogMode("view");
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSubCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (subCategoryToDelete) {
      try {
        await deleteSubCategory(subCategoryToDelete);
        setDeleteDialogOpen(false);
        setSubCategoryToDelete(null);
      } catch (err) {
        // Error is already handled in the hook
        setDeleteDialogOpen(false);
        setSubCategoryToDelete(null);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === "add") {
      await addSubCategory(data);
    } else if (dialogMode === "edit" && selectedSubCategory) {
      await updateSubCategory(selectedSubCategory.id, data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sub-Categories</h1>
          <p className="text-muted-foreground">
            Manage sub-categories for your inventory
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sub-Category
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sub-categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubCategories.map((subCategory) => (
          <Card key={subCategory.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{subCategory.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-sm">{subCategory.categoryName || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{subCategory.description || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Created Date</p>
                <p className="text-sm">{subCategory.createdAt}</p>
              </div>

              <div className="flex justify-end space-x-1 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(subCategory)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(subCategory)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(subCategory.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No sub-categories found</p>
        </div>
      )}

      <SubCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subCategory={selectedSubCategory}
        mode={dialogMode}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              sub-category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
