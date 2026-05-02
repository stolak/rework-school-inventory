import { useMemo, useState } from "react";
import { Plus, Search, Eye, Edit, Trash2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectDialog } from "@/components/dialogs/ProjectDialog";
import { useProjects, type ProjectRow } from "@/hooks/useProjects";
import type { ProjectFormData } from "@/components/forms/ProjectForm";
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

export default function ProjectSetup() {
  const { projects, addProject, updateProject, deleteProject, isLoading } =
    useProjects({ page: 1, limit: 100 });

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedProject, setSelectedProject] = useState<ProjectRow | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    const q = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, searchTerm]);

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
    setSelectedProject(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (project: ProjectRow) => {
    setDialogMode("edit");
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleView = (project: ProjectRow) => {
    setDialogMode("view");
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete);
      setProjectToDelete(null);
      setDeleteDialogOpen(false);
    } catch {
      setProjectToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (data: ProjectFormData) => {
    const body = {
      name: data.name,
      description: data.description?.trim() || undefined,
      status: data.status,
    };
    if (dialogMode === "add") {
      await addProject(body);
    } else if (dialogMode === "edit" && selectedProject) {
      await updateProject(selectedProject.id, body);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderKanban className="h-8 w-8" />
            Project setup
          </h1>
          <p className="text-muted-foreground">Create and manage projects</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add project
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium max-w-[180px] truncate">
                    {project.name}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-muted-foreground">
                    {project.description?.trim() ? project.description : "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>{project.transactionCount ?? "—"}</TableCell>
                  <TableCell className="text-sm max-w-[140px] truncate">
                    {project.creatorDisplayName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(project)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(project)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(project.id)}>
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

      {!isLoading && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found</p>
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        project={selectedProject}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The project will be removed if the server allows deletion.
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
