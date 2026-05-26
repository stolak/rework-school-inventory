import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  donationsApi,
  type DonationGroup,
  type DonationRow,
} from "@/lib/api";
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
  isAcknowledged?: boolean;
  acknowledgedAt?: string | null;
  acknowledgedByName?: string;
}

export interface DonationBatch {
  referenceNo: string | null;
  notes: string | null;
  transactionDate: string;
  createdByName?: string;
  storeName?: string;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedByName?: string;
  rows: Donation[];
}

function mapDonationRow(d: DonationRow): Donation {
  return {
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
    isAcknowledged: Boolean(d.isAcknowledged),
    acknowledgedAt: d.acknowledgedAt ?? null,
    acknowledgedByName: d.acknowledgedByUser
      ? `${d.acknowledgedByUser.firstName ?? ""} ${d.acknowledgedByUser.lastName ?? ""}`.trim() ||
        d.acknowledgedByUser.email
      : undefined,
  };
}

function mapDonationGroup(group: DonationGroup): DonationBatch {
  const rows = group.donations.map(mapDonationRow);
  const first = rows[0];

  if (!first) {
    return {
      referenceNo: group.referenceNo ?? null,
      notes: null,
      transactionDate: "",
      isAcknowledged: true,
      acknowledgedAt: null,
      rows: [],
    };
  }

  const acknowledgedRow = rows.find((r) => r.isAcknowledged && r.acknowledgedAt);

  return {
    referenceNo: group.referenceNo ?? first.referenceNo,
    notes: first.notes,
    transactionDate: first.transactionDate,
    createdByName: first.createdByName,
    storeName: first.storeName,
    isAcknowledged: rows.length > 0 && rows.every((r) => r.isAcknowledged),
    acknowledgedAt: acknowledgedRow?.acknowledgedAt ?? first.acknowledgedAt ?? null,
    acknowledgedByName:
      acknowledgedRow?.acknowledgedByName ?? first.acknowledgedByName,
    rows,
  };
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
    queryKey: ["donations", "grouped", params],
    queryFn: () => donationsApi.listGrouped(params),
  });

  const donationBatches: DonationBatch[] = (raw?.data?.groups ?? []).map(
    mapDonationGroup,
  );

  const bulkCreateMutation = useMutation({
    mutationFn: donationsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
    },
    onError: (error: Error) => {
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
    onError: (error: Error) => {
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

  const acknowledgeMutation = useMutation({
    mutationFn: donationsApi.acknowledgeReceive,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast({
        title: "Success",
        description:
          res?.message || "Inventory receipt acknowledged successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to acknowledge inventory receipt",
        variant: "destructive",
      });
    },
  });

  const acknowledgeReceive = async (referenceNo: string) =>
    acknowledgeMutation.mutateAsync({ referenceNo });

  return {
    donationBatches,
    isLoading,
    error,
    createBulkDonations,
    deleteDonation,
    acknowledgeReceive,
    isAcknowledging: acknowledgeMutation.isPending,
    pagination: raw?.data?.pagination,
  };
}
