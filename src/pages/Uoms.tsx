import { useState } from "react";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UomDialog } from "@/components/dialogs/UomDialog";
import { useUoms, Uom } from "@/hooks/useUoms";
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

export default function Uoms() {
  const { uoms, addUom, updateUom, deleteUom } = useUoms();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedUom, setSelectedUom] = useState<Uom | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uomToDelete, setUomToDelete] = useState<string | null>(null);

  const filteredUoms = uoms.filter(
    (uom) =>
      uom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uom.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setDialogMode("add");
    setSelectedUom(undefined);
    setDialogOpen(true);
  };

  const handleView = (uom: Uom) => {
    setDialogMode("view");
    setSelectedUom(uom);
    setDialogOpen(true);
  };

  const handleEdit = (uom: Uom) => {
    setDialogMode("edit");
    setSelectedUom(uom);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setUomToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (uomToDelete) {
      try {
        await deleteUom(uomToDelete);
        setUomToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setUomToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === "add") {
      await addUom(data);
    } else if (dialogMode === "edit" && selectedUom) {
      await updateUom(selectedUom.id, data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Units of Measurement</h1>
          <p className="text-muted-foreground">
            Manage units of measurement for inventory items
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUoms.map((uom) => (
          <Card key={uom.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{uom.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Symbol</p>
                <p className="text-sm">{uom.symbol}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Created Date</p>
                <p className="text-sm">{uom.createdAt}</p>
              </div>

              <div className="flex justify-end space-x-1 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(uom)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(uom)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(uom.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUoms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No units found</p>
        </div>
      )}

      <UomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        uom={selectedUom}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              unit of measurement.
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
