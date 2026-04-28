import { useMemo, useState } from "react";
import { Plus, Search, Eye, Edit, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TermDialog } from "@/components/dialogs/TermDialog";
import { useTerms, type Term } from "@/hooks/useTerms";
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

export default function Terms() {
  const { terms, addTerm, updateTerm, deleteTerm, isLoading } = useTerms({
    page: 1,
    limit: 20,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedTerm, setSelectedTerm] = useState<Term | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    if (!searchTerm.trim()) return terms;
    const q = searchTerm.toLowerCase();
    return terms.filter((t) => t.name.toLowerCase().includes(q));
  }, [terms, searchTerm]);

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
    setSelectedTerm(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (term: Term) => {
    setDialogMode("edit");
    setSelectedTerm(term);
    setDialogOpen(true);
  };

  const handleView = (term: Term) => {
    setDialogMode("view");
    setSelectedTerm(term);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTermToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (termToDelete) {
      try {
        await deleteTerm(termToDelete);
        setTermToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        setTermToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === "add") {
      await addTerm(data);
    } else if (dialogMode === "edit" && selectedTerm) {
      await updateTerm(selectedTerm.id, data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Terms
          </h1>
          <p className="text-muted-foreground">Manage academic terms</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Term
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-md border bg-background overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTerms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.name}</TableCell>
                  <TableCell>{getStatusBadge(term.status)}</TableCell>
                  <TableCell>
                    {term.createdAt ? new Date(term.createdAt).toLocaleString() : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(term)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(term)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(term.id)}>
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

      {!isLoading && filteredTerms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No terms found</p>
        </div>
      )}

      <TermDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        term={selectedTerm}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the term.
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

