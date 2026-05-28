import { useState } from "react";
import { Building2, Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFacilities, type Facility } from "@/hooks/useFacilities";
import { FacilityDialog } from "@/components/dialogs/FacilityDialog";
import type { FacilityFormSubmitData } from "@/components/forms/FacilityForm";
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

export function FacilityUnitSetupContent({ embedded = false }: { embedded?: boolean }) {
  const { facilities, isLoading, addFacility, updateFacility, deleteFacility } = useFacilities();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedFacility, setSelectedFacility] = useState<Facility | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<string | null>(null);

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingDelete = facilities.find((f) => f.id === facilityToDelete);

  const handleAdd = () => {
    setDialogMode("add");
    setSelectedFacility(undefined);
    setDialogOpen(true);
  };

  const handleView = (facility: Facility) => {
    setDialogMode("view");
    setSelectedFacility(facility);
    setDialogOpen(true);
  };

  const handleEdit = (facility: Facility) => {
    setDialogMode("edit");
    setSelectedFacility(facility);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setFacilityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!facilityToDelete) return;
    try {
      await deleteFacility(facilityToDelete);
    } finally {
      setFacilityToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (data: FacilityFormSubmitData) => {
    if (dialogMode === "add") {
      await addFacility({ name: data.name, description: data.description });
    } else if (dialogMode === "edit" && selectedFacility) {
      await updateFacility(selectedFacility.id, {
        name: data.name,
        description: data.description,
        status: data.status,
      });
    }
  };

  return (
    <div className={embedded ? "space-y-6" : "p-6 space-y-6"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Facility
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage facilities for inventory locations and organization.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add facility
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search facilities…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading facilities…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
            <Card key={facility.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug">{facility.name}</CardTitle>
                  <Badge variant={facility.status === "active" ? "default" : "secondary"}>
                    {facility.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm line-clamp-3">{facility.description || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <p className="text-sm">{facility.createdByName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inventory transactions</p>
                  <p className="text-sm">{facility.transactionCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">{facility.createdAt}</p>
                </div>
                <div className="flex justify-end space-x-1 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleView(facility)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(facility)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(facility.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredFacilities.length === 0 && (
        <p className="text-muted-foreground text-center py-12">No facilities found.</p>
      )}

      <FacilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        facility={selectedFacility}
        onSubmit={handleSubmit}
        onRequestEdit={() => setDialogMode("edit")}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete facility?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <>
                  Delete <span className="font-medium text-foreground">{pendingDelete.name}</span>?
                  This cannot be undone. Associated inventory may be affected depending on your
                  backend rules.
                </>
              ) : (
                "This cannot be undone."
              )}
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

export default function FacilityUnitSetup() {
  return <FacilityUnitSetupContent />;
}
