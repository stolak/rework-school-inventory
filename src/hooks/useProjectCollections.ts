import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectCollectionsApi, type ProjectCollectionRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface ProjectCollection {
  id: string;
  itemId: string;
  qtyOut: number;
  referenceNo: string | null;
  notes: string | null;
  projectId: string | null;
  staffId: string | null;
  sessionId: string | null;
  termId: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  itemName?: string;
  projectName?: string;
  staffLabel?: string;
  createdByName?: string;
}

export function useProjectCollections(params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  projectId?: string;
  staffId?: string;
  sessionId?: string;
  termId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: raw = null, isLoading, error } = useQuery({
    queryKey: ["project-collections", params],
    queryFn: () => projectCollectionsApi.list(params),
  });

  const rawRows: ProjectCollectionRow[] = raw?.data?.projectCollections ?? [];

  const projectCollections: ProjectCollection[] = rawRows.map((r: any) => {
    const staff = r.staff;
    const staffLabel = staff
      ? [staff.name, staff.StaffNumber, staff.email].filter(Boolean).join(" — ") ||
        staff.id
      : undefined;

    return {
      id: r.id,
      itemId: r.itemId,
      qtyOut: Number(r.qtyOut ?? 0),
      referenceNo: r.referenceNo ?? null,
      notes: r.notes ?? null,
      projectId: r.projectId ?? null,
      staffId: r.staffId ?? null,
      sessionId: r.sessionId ?? null,
      termId: r.termId ?? null,
      transactionDate: r.transactionDate,
      createdById: r.createdById,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      itemName: r.item?.name || "Unknown item",
      projectName: r.project?.name,
      staffLabel,
      createdByName: r.createdBy
        ? `${r.createdBy.firstName ?? ""} ${r.createdBy.lastName ?? ""}`.trim()
        : undefined,
    };
  });

  const bulkCreateMutation = useMutation({
    mutationFn: projectCollectionsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-collections"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record project collections",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectCollectionsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-collections"] });
      toast({
        title: "Success",
        description: "Project collection deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project collection",
        variant: "destructive",
      });
    },
  });

  const createBulkProjectCollections = async (payload: {
    notes?: string;
    projectId: string;
    staffId: string;
    transactionDate: string;
    items: { itemId: string; qtyOut: number }[];
  }) => bulkCreateMutation.mutateAsync(payload);

  const deleteProjectCollection = async (id: string) =>
    deleteMutation.mutateAsync(id);

  return {
    projectCollections,
    isLoading,
    error,
    createBulkProjectCollections,
    deleteProjectCollection,
    pagination: raw?.data?.pagination,
  };
}
