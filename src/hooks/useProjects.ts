import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectApi, type Project } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type ProjectRow = Project & {
  creatorDisplayName?: string;
  transactionCount?: number;
};

function normalizeProject(p: Project): ProjectRow {
  const by = p.CreatedBy ?? p.createdBy;
  const creatorDisplayName = by
    ? `${by.firstName ?? ""} ${by.lastName ?? ""}`.trim() || by.email || undefined
    : undefined;
  const transactionCount =
    p._count?.inventoryTransactions ??
    (Array.isArray(p.inventoryTransactions)
      ? p.inventoryTransactions.length
      : undefined);

  return {
    ...p,
    creatorDisplayName,
    transactionCount,
  };
}

export function useProjects(params?: { page?: number; limit?: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["projects", page, limit],
    queryFn: () => projectApi.list({ page, limit }),
  });

  const rawProjects = (response as any)?.data?.projects ?? [];
  const pagination = (response as any)?.data?.pagination;

  const projects: ProjectRow[] = rawProjects.map((p: Project) =>
    normalizeProject(p)
  );

  const addMutation = useMutation({
    mutationFn: projectApi.create,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: res?.message || "Project created successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectApi.update(id, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: res?.message || "Project updated successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectApi.remove,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: res?.message || "Project deleted successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  return {
    projects,
    pagination,
    isLoading,
    error,
    addProject: addMutation.mutateAsync,
    updateProject: (id: string, data: Partial<Project>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteProject: deleteMutation.mutateAsync,
  };
}
