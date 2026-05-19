import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  facilityCollectionsApi,
  type FacilityCollectionRow,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface FacilityCollection {
  id: string;
  itemId: string;
  qtyOut: number;
  referenceNo: string | null;
  notes: string | null;
  facilityId: string | null;
  staffId: string | null;
  storeId: string | null;
  sessionId: string | null;
  termId: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  itemName?: string;
  facilityName?: string;
  storeName?: string;
  staffLabel?: string;
  createdByName?: string;
}

export function useFacilityCollections(params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  facilityId?: string;
  staffId?: string;
  sessionId?: string;
  termId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: raw = null, isLoading, error } = useQuery({
    queryKey: ["facility-collections", params],
    queryFn: () => facilityCollectionsApi.list(params),
  });

  const rawRows: FacilityCollectionRow[] =
    raw?.data?.facilityCollections ?? [];

  const facilityCollections: FacilityCollection[] = rawRows.map((r) => {
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
      facilityId: r.facilityId ?? null,
      staffId: r.staffId ?? null,
      storeId: r.storeId ?? null,
      sessionId: r.sessionId ?? null,
      termId: r.termId ?? null,
      transactionDate: r.transactionDate,
      createdById: r.createdById,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      itemName: r.item?.name || "Unknown item",
      facilityName: r.facility?.name,
      storeName: r.store?.name,
      staffLabel,
      createdByName: r.createdBy
        ? `${r.createdBy.firstName ?? ""} ${r.createdBy.lastName ?? ""}`.trim()
        : undefined,
    };
  });

  const bulkCreateMutation = useMutation({
    mutationFn: facilityCollectionsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility-collections"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record facility distribution",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: facilityCollectionsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility-collections"] });
      toast({
        title: "Success",
        description: "Facility distribution line deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete facility distribution",
        variant: "destructive",
      });
    },
  });

  const createBulkFacilityCollections = async (payload: {
    notes?: string;
    facilityId: string;
    staffId: string;
    storeId: string;
    referenceNo?: string;
    transactionDate: string;
    items: { itemId: string; qtyOut: number }[];
  }) => bulkCreateMutation.mutateAsync(payload);

  const deleteFacilityCollection = async (id: string) =>
    deleteMutation.mutateAsync(id);

  return {
    facilityCollections,
    isLoading,
    error,
    createBulkFacilityCollections,
    deleteFacilityCollection,
    pagination: raw?.data?.pagination,
  };
}
