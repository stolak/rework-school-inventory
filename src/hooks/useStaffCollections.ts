import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffCollectionsApi, type StaffCollectionRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface StaffCollection {
  id: string;
  itemId: string;
  qtyOut: number;
  referenceNo: string | null;
  notes: string | null;
  staffId: string | null;
  sessionId: string | null;
  termId: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  itemName?: string;
  staffName?: string;
  staffNumber?: string;
}

export function useStaffCollections(params?: {
  page?: number;
  limit?: number;
  staffId?: string;
  sessionId?: string;
  termId?: string;
  itemId?: string;
  referenceNo?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: raw = null, isLoading, error } = useQuery({
    queryKey: ["staff-collections", params],
    queryFn: () => staffCollectionsApi.list(params),
  });

  const rawCollections: StaffCollectionRow[] = raw?.data?.staffCollections ?? [];

  const collections: StaffCollection[] = rawCollections.map((c: any) => ({
    id: c.id,
    itemId: c.itemId,
    qtyOut: Number(c.qtyOut ?? 0),
    referenceNo: c.referenceNo ?? null,
    notes: c.notes ?? null,
    staffId: c.staffId ?? null,
    sessionId: c.sessionId ?? null,
    termId: c.termId ?? null,
    transactionDate: c.transactionDate,
    createdById: c.createdById,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    itemName: c.item?.name || "Unknown Item",
    staffName: c.staff?.name || "Unknown Staff",
    staffNumber: c.staff?.StaffNumber ?? undefined,
  }));

  const bulkCreateMutation = useMutation({
    mutationFn: staffCollectionsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-collections"] });
      toast({
        title: "Success",
        description: "Staff collection created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff collection",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: staffCollectionsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-collections"] });
      toast({
        title: "Success",
        description: "Staff collection deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff collection",
        variant: "destructive",
      });
    },
  });

  const createBulkCollection = async (payload: {
    staffId: string;
    notes?: string;
    transactionDate: string;
    items: { itemId: string; qtyOut: number }[];
  }) => {
    return bulkCreateMutation.mutateAsync(payload);
  };

  const deleteCollection = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    collections,
    isLoading,
    error,
    createBulkCollection,
    deleteCollection,
    pagination: raw?.data?.pagination,
  };
}

