import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Layers,
  Package2,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCategories, type Category } from "@/hooks/useCategories";
import { useSubCategories, type SubCategory } from "@/hooks/useSubCategories";
import { CategoryDialog } from "@/components/dialogs/CategoryDialog";
import type { CategoryFormSubmitData } from "@/components/forms/CategoryForm";
import { SubCategoryDialog } from "@/components/dialogs/SubCategoryDialog";
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
import { cn } from "@/lib/utils";

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }
    if (
      !selectedCategoryId ||
      !categories.some((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const {
    subCategories,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
  } = useSubCategories(
    selectedCategoryId ? { categoryId: selectedCategoryId } : undefined
  );

  const [categorySearch, setCategorySearch] = useState("");
  const [subSearch, setSubSearch] = useState("");

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<"add" | "edit" | "view">("add");
  const [categoryForDialog, setCategoryForDialog] = useState<Category | undefined>();
  const [categoryDeleteOpen, setCategoryDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subDialogMode, setSubDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | undefined>();
  const [subDeleteOpen, setSubDeleteOpen] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
          c.description.toLowerCase().includes(categorySearch.toLowerCase())
      ),
    [categories, categorySearch]
  );

  const filteredSubCategories = useMemo(
    () =>
      subCategories.filter(
        (s) =>
          s.name.toLowerCase().includes(subSearch.toLowerCase()) ||
          (s.description ?? "").toLowerCase().includes(subSearch.toLowerCase())
      ),
    [subCategories, subSearch]
  );

  const handleAddCategory = () => {
    setCategoryDialogMode("add");
    setCategoryForDialog(undefined);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryDialogMode("edit");
    setCategoryForDialog(category);
    setCategoryDialogOpen(true);
  };

  const handleViewCategory = (category: Category) => {
    setCategoryDialogMode("view");
    setCategoryForDialog(category);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    setCategoryToDelete(id);
    setCategoryDeleteOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete);
    } finally {
      setCategoryToDelete(null);
      setCategoryDeleteOpen(false);
    }
  };

  const categoryPendingDelete = useMemo(
    () => categories.find((c) => c.id === categoryToDelete) ?? null,
    [categories, categoryToDelete]
  );

  const handleCategorySubmit = async (data: CategoryFormSubmitData) => {
    if (categoryDialogMode === "add") {
      await addCategory({
        name: data.name,
        description: data.description,
        categoryType: data.categoryType,
        consumableAccountId: data.consumableAccountId,
      });
    } else if (categoryDialogMode === "edit" && categoryForDialog) {
      await updateCategory(categoryForDialog.id, {
        name: data.name,
        description: data.description,
        categoryType: data.categoryType,
        status: data.status,
        consumableAccountId: data.consumableAccountId,
      });
    }
  };

  const categoryTypeBadge = (type: Category["categoryType"]) => (
    <Badge variant="outline" className="text-xs shrink-0">
      {type === "NonConsumable" ? "Non-consumable" : "Consumable"}
    </Badge>
  );

  const handleAddSub = () => {
    setSelectedSubCategory(undefined);
    setSubDialogMode("add");
    setSubDialogOpen(true);
  };

  const handleEditSub = (sub: SubCategory) => {
    setSelectedSubCategory(sub);
    setSubDialogMode("edit");
    setSubDialogOpen(true);
  };

  const handleViewSub = (sub: SubCategory) => {
    setSelectedSubCategory(sub);
    setSubDialogMode("view");
    setSubDialogOpen(true);
  };

  const handleDeleteSub = (id: string) => {
    setSubCategoryToDelete(id);
    setSubDeleteOpen(true);
  };

  const confirmDeleteSub = async () => {
    if (!subCategoryToDelete) return;
    try {
      await deleteSubCategory(subCategoryToDelete);
    } finally {
      setSubDeleteOpen(false);
      setSubCategoryToDelete(null);
    }
  };

  const handleSubSubmit = async (data: unknown) => {
    if (subDialogMode === "add") {
      await addSubCategory(data as Parameters<typeof addSubCategory>[0]);
    } else if (subDialogMode === "edit" && selectedSubCategory) {
      await updateSubCategory(selectedSubCategory.id, data as Parameters<typeof updateSubCategory>[1]);
    }
  };

  const categoryStatusBadge = (status: string) => (
    <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package2 className="h-8 w-8" />
          Categories &amp; sub-categories
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Pick a category on the left, then add or edit its sub-categories on the right. Inventory
          items use both levels.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[520px]">
        <Card className="shadow-card lg:w-[min(100%,380px)] shrink-0 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Categories
                </CardTitle>
                <CardDescription>Top-level grouping for inventory</CardDescription>
              </div>
              <Button type="button" size="sm" className="shrink-0" onClick={handleAddCategory}>
                <Plus className="mr-2 h-4 w-4" />
                Add category
              </Button>
            </div>
            <div className="relative pt-2">
              <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search categories…"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 min-h-0 flex flex-col">
            <ScrollArea className="h-[min(420px,calc(100vh-280px))] pr-3">
              <div className="space-y-1.5">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      "flex items-stretch rounded-lg border gap-0 overflow-hidden transition-colors",
                      "hover:bg-accent/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                      selectedCategoryId === category.id
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-transparent bg-muted/40"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={cn(
                        "flex-1 min-w-0 text-left px-3 py-2.5 outline-none",
                        "hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <span className="font-medium leading-snug">{category.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {categoryTypeBadge(category.categoryType)}
                          {categoryStatusBadge(category.status)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {category.description || "—"}
                      </p>
                      {category.categoryType === "Consumable" && category.consumableAccount ? (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          GL:{" "}
                          {category.consumableAccount.accountNo?.trim()
                            ? `${category.consumableAccount.accountNo} — ${category.consumableAccount.accountDescription}`
                            : category.consumableAccount.accountDescription}
                        </p>
                      ) : null}
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{category.itemCount} items</span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 opacity-40",
                            selectedCategoryId === category.id && "text-primary opacity-100"
                          )}
                        />
                      </div>
                    </button>
                    <div className="flex flex-col justify-center gap-0.5 py-1.5 pr-1.5 pl-0.5 shrink-0 border-l border-border/50 bg-background/40">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="View details"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          handleViewCategory(category);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Edit category"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          handleEditCategory(category);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete category"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          handleDeleteCategory(category.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {filteredCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No categories match.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card flex-1 min-w-0 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Sub-categories
                </CardTitle>
                <CardDescription>
                  {activeCategory ? (
                    <>
                      For <span className="font-medium text-foreground">{activeCategory.name}</span>
                    </>
                  ) : (
                    "Select a category to load sub-categories."
                  )}
                </CardDescription>
              </div>
              <Button
                onClick={handleAddSub}
                disabled={!selectedCategoryId}
                size="sm"
                className="shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add sub-category
              </Button>
            </div>
            <div className="relative pt-2">
              <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search sub-categories…"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                className="pl-8"
                disabled={!selectedCategoryId}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 min-h-0">
            {!selectedCategoryId ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                Choose a category from the list.
              </div>
            ) : (
              <>
                <ScrollArea className="h-[min(420px,calc(100vh-280px))]">
                  <div className="grid gap-4 sm:grid-cols-2 pr-3">
                    {filteredSubCategories.map((sub) => (
                      <Card
                        key={sub.id}
                        className="border-muted/80 hover:border-muted transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{sub.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Description</p>
                            <p className="line-clamp-2">{sub.description || "—"}</p>
                          </div>
                          <div className="flex justify-end gap-1 pt-1">
                            <Button size="sm" variant="outline" onClick={() => handleViewSub(sub)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditSub(sub)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteSub(sub.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                {filteredSubCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    No sub-categories yet for this category.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        mode={categoryDialogMode}
        category={categoryForDialog}
        onSubmit={handleCategorySubmit}
        onRequestEdit={() => setCategoryDialogMode("edit")}
      />

      <SubCategoryDialog
        open={subDialogOpen}
        onOpenChange={setSubDialogOpen}
        subCategory={selectedSubCategory}
        mode={subDialogMode}
        defaultCategoryId={selectedCategoryId ?? undefined}
        onSubmit={handleSubSubmit}
      />

      <AlertDialog open={categoryDeleteOpen} onOpenChange={setCategoryDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryPendingDelete ? (
                <>
                  Delete <span className="font-medium text-foreground">{categoryPendingDelete.name}</span>?
                  This cannot be undone. Associated inventory may be affected depending on your backend
                  rules.
                </>
              ) : (
                "This cannot be undone. Associated inventory may be affected depending on your backend rules."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={subDeleteOpen} onOpenChange={setSubDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-category?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. This will permanently delete the sub-category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSub}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
