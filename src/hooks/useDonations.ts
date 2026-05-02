import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { donationsApi, type DonationRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Donation {
  id: string;
  itemId: string;
  qtyIn: number;
  referenceNo: string | null;
  notes: string | null;
  sessionId: string | null;
  termId: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  storeId?: string | null;
  storeName?: string;
  itemName?: string;
  createdByName?: string;
}

export function useDonations(params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  storeId?: string;
  sessionId?: string;
  termId?: string;
  referenceNo?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: raw = null, isLoading, error } = useQuery({
    queryKey: ["donations", params],
    queryFn: () => donationsApi.list(params),
  });

  const rawDonations: DonationRow[] = raw?.data?.donations ?? [];

  const donations: Donation[] = rawDonations.map((d: any) => ({
    id: d.id,
    itemId: d.itemId,
    qtyIn: Number(d.qtyIn ?? 0),
    referenceNo: d.referenceNo ?? null,
    notes: d.notes ?? null,
    sessionId: d.sessionId ?? null,
    termId: d.termId ?? null,
    transactionDate: d.transactionDate,
    createdById: d.createdById,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    storeId: d.storeId ?? null,
    storeName: d.store?.name,
    itemName: d.item?.name || "Unknown Item",
    createdByName: d.createdBy
      ? `${d.createdBy.firstName ?? ""} ${d.createdBy.lastName ?? ""}`.trim()
      : undefined,
  }));

  const bulkCreateMutation = useMutation({
    mutationFn: donationsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record donations",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: donationsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast({
        title: "Success",
        description: "Donation deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete donation",
        variant: "destructive",
      });
    },
  });

  const createBulkDonations = async (payload: {
    storeId: string;
    notes?: string;
    transactionDate: string;
    items: { itemId: string; qtyIn: number }[];
  }) => bulkCreateMutation.mutateAsync(payload);

  const deleteDonation = async (id: string) => deleteMutation.mutateAsync(id);

  return {
    donations,
    isLoading,
    error,
    createBulkDonations,
    deleteDonation,
    pagination: raw?.data?.pagination,
  };
}
