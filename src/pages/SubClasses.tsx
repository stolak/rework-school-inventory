import { useMemo, useState } from "react";
import { Layers, Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { SubClassDialog } from "@/components/dialogs/SubClassDialog";
import { useSubClasses, type SubClass } from "@/hooks/useSubClasses";
import type { SubClassFormData } from "@/components/forms/SubClassForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SubClasses() {
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedSubClass, setSelectedSubClass] = useState<SubClass | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subClassToDelete, setSubClassToDelete] = useState<SubClass | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const { subClasses, addSubClass, updateSubClass, deleteSubClass, isLoading } = useSubClasses({
    page: 1,
    limit: 20,
  });

  const filtered = useMemo(() => {
    if (!q.trim()) return subClasses;
    const needle = q.toLowerCase();
    return subClasses.filter((sc) => {
      return (
        sc.name.toLowerCase().includes(needle) ||
        (sc.class?.name || "").toLowerCase().includes(needle)
      );
    });
  }, [subClasses, q]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "bg-success/10 text-success",
      Inactive: "bg-warning/10 text-warning",
    };
    return (
      <Badge variant="secondary" className={variants[status] ?? "bg-muted text-muted-foreground"}>
        {status}
      </Badge>
    );
  };

  const handleAdd = () => {
    setDialogMode("add");
    setSelectedSubClass(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (sc: SubClass) => {
    setDialogMode("edit");
    setSelectedSubClass(sc);
    setDialogOpen(true);
  };

  const handleView = (sc: SubClass) => {
    setDialogMode("view");
    setSelectedSubClass(sc);
    setDialogOpen(true);
  };

  const handleDelete = (sc: SubClass) => {
    setSubClassToDelete(sc);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!subClassToDelete) return;
    try {
      await deleteSubClass(subClassToDelete.id);
    } finally {
      setSubClassToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (data: SubClassFormData) => {
    if (dialogMode === "add") {
      await addSubClass(data);
      return;
    }
    if (dialogMode === "edit" && selectedSubClass) {
      await updateSubClass(selectedSubClass.id, data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-8 w-8" />
            Sub Classes
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage sub classes under each school class (e.g., A, B, C).
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Create Sub Class
        </Button>
      </div>

      {/* Search + view toggle */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by sub class or class name..."
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
          >
            Table
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((sc) => (
            <Card
              key={sc.id}
              className="shadow-card hover:shadow-elevated transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">{sc.name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {sc.class?.name || "N/A"}
                    </p>
                  </div>
                  {getStatusBadge(sc.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {sc.createdAt ? new Date(sc.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Updated</p>
                    <p className="font-medium">
                      {sc.updatedAt ? new Date(sc.updatedAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(sc)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(sc)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sc)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-background overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sub class</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sc) => (
                <TableRow key={sc.id}>
                  <TableCell className="font-medium">{sc.name}</TableCell>
                  <TableCell>{sc.class?.name || "N/A"}</TableCell>
                  <TableCell>{getStatusBadge(sc.status)}</TableCell>
                  <TableCell>
                    {sc.createdAt ? new Date(sc.createdAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    {sc.updatedAt ? new Date(sc.updatedAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(sc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(sc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(sc)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-10">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No sub classes found</h3>
          <p className="text-muted-foreground">
            {q ? "Try adjusting your search." : "Create your first sub class."}
          </p>
          {!q && (
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Sub Class
            </Button>
          )}
        </div>
      )}

      <SubClassDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        subClass={selectedSubClass}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this sub class.
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

