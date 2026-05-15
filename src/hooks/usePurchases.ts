import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  purchaseApi,
  type GroupedPurchase,
  type Pagination,
  type Purchase,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type { GroupedPurchase, GroupedPurchaseLineItem } from "@/lib/api";
export type { Purchase };

export function groupedPurchaseTotalCost(group: GroupedPurchase): number {
  return group.items.reduce((sum, it) => sum + Number(it.inCost || 0), 0);
}

export function groupedPurchaseTotalQty(group: GroupedPurchase): number {
  return group.items.reduce((sum, it) => sum + Number(it.qtyIn || 0), 0);
}

export function usePurchases(params?: {
  supplierId?: string;
  storeId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "purchases-grouped",
      params?.supplierId ?? null,
      params?.storeId ?? null,
      params?.transactionDateFrom ?? null,
      params?.transactionDateTo ?? null,
      params?.page ?? 1,
      params?.limit ?? 20,
    ],
    queryFn: async () => {
      const res = await purchaseApi.listGrouped({
        supplierId: params?.supplierId,
        storeId: params?.storeId,
        transactionDateFrom: params?.transactionDateFrom,
        transactionDateTo: params?.transactionDateTo,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      });
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load purchases");
      }
      return {
        purchases: res.data.purchases as GroupedPurchase[],
        pagination: res.data.pagination as Pagination,
      };
    },
  });

  const groupedPurchases = data?.purchases ?? [];
  const pagination = data?.pagination ?? null;

  const addMutation = useMutation({
    mutationFn: async (body: unknown) => {
      const res = await purchaseApi.create(body as Parameters<typeof purchaseApi.create>[0]);
      if (!res?.success) throw new Error(res?.message || "Failed to create purchase");
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["purchases-grouped"] });
      toast({
        title: "Success",
        description: res?.message || "Purchase created successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create purchase",
        variant: "destructive",
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (body: unknown) => {
      const res = await purchaseApi.bulkCreate(
        body as Parameters<typeof purchaseApi.bulkCreate>[0]
      );
      if (!res?.success)
        throw new Error(res?.message || "Failed to create purchases");
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["purchases-grouped"] });
      toast({
        title: "Success",
        description: res?.message || "Purchases created successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create purchases",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      purchaseApi.update(id, data as Parameters<typeof purchaseApi.update>[1]),
    onSuccess: (res) => {
      if (!res?.success) throw new Error(res?.message || "Failed to update purchase");
      queryClient.invalidateQueries({ queryKey: ["purchases-grouped"] });
      toast({
        title: "Success",
        description: res?.message || "Purchase updated successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update purchase",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await purchaseApi.remove(id);
      if (!res?.success) throw new Error(res?.message || "Failed to delete purchase");
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["purchases-grouped"] });
      toast({
        title: "Success",
        description: res?.message || "Purchase deleted successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete purchase",
        variant: "destructive",
      });
    },
  });

  return {
    groupedPurchases,
    pagination,
    isLoading,
    error,
    addPurchase: addMutation.mutateAsync,
    bulkCreatePurchases: bulkCreateMutation.mutateAsync,
    updatePurchase: (id: string, data: unknown) =>
      updateMutation.mutateAsync({ id, data }),
    deletePurchase: deleteMutation.mutateAsync,
  };
}
