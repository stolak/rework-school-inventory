import { useState } from "react";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrands, Brand } from "@/hooks/useBrands";
import { BrandDialog } from "@/components/dialogs/BrandDialog";
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

export default function Brands() {
  const { brands, addBrand, updateBrand, deleteBrand } = useBrands();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setDialogMode("add");
    setSelectedBrand(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setDialogMode("edit");
    setSelectedBrand(brand);
    setDialogOpen(true);
  };

  const handleView = (brand: Brand) => {
    setDialogMode("view");
    setSelectedBrand(brand);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setBrandToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (brandToDelete) {
      try {
        await deleteBrand(brandToDelete);
        setBrandToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setBrandToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === "add") {
      try {
        await addBrand(data);
      } catch (err) {
        // Error is already handled in the hook
      }
    } else if (dialogMode === "edit" && selectedBrand) {
      try {
        await updateBrand(selectedBrand.id, data);
      } catch (err) {
        // Error is already handled in the hook
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground">
            Manage brands for your inventory
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBrands.map((brand) => (
          <Card key={brand.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{brand.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created Date</p>
                <p className="text-sm">{brand.createdAt}</p>
              </div>

              <div className="flex justify-end space-x-1 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(brand)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(brand)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(brand.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBrands.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No brands found</p>
        </div>
      )}

      <BrandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        brand={selectedBrand}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              brand and all associated inventory items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
