import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  salesApi,
  type GroupedSale,
  type Pagination,
  type Sale,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type { GroupedSale, GroupedSaleLineItem, Sale } from "@/lib/api";

export function groupedSaleCustomerName(group: GroupedSale): string {
  return (group.customerMame ?? group.customerName ?? "").trim();
}

export function groupedSaleTotalAmount(group: GroupedSale): number {
  if (group.totalAmount != null && group.totalAmount !== "") {
    return Number(group.totalAmount) || 0;
  }
  return group.items.reduce((sum, it) => sum + Number(it.outCost || 0), 0);
}

export function groupedSaleTotalQty(group: GroupedSale): number {
  return group.items.reduce((sum, it) => sum + Number(it.qtyOut || 0), 0);
}

export function groupedSaleKey(group: GroupedSale): string {
  return `${group.storeId}-${group.referenceNo}-${group.transactionDate}`;
}

export function useSales(params?: {
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
      "sales-grouped",
      params?.storeId ?? null,
      params?.transactionDateFrom ?? null,
      params?.transactionDateTo ?? null,
      params?.page ?? 1,
      params?.limit ?? 20,
    ],
    queryFn: async () => {
      const res = await salesApi.listGrouped({
        storeId: params?.storeId,
        transactionDateFrom: params?.transactionDateFrom,
        transactionDateTo: params?.transactionDateTo,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      });
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load sales");
      }
      return {
        sales: res.data.sales as GroupedSale[],
        pagination: res.data.pagination as Pagination,
      };
    },
  });

  const groupedSales = data?.sales ?? [];
  const pagination = data?.pagination ?? null;

  const bulkCreateMutation = useMutation({
    mutationFn: async (body: unknown) => {
      const res = await salesApi.bulkCreate(
        body as Parameters<typeof salesApi.bulkCreate>[0]
      );
      if (!res?.success) throw new Error(res?.message || "Failed to create sales");
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["sales-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Success",
        description: res?.message || "Sales created successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create sales",
        variant: "destructive",
      });
    },
  });

  return {
    groupedSales,
    pagination,
    isLoading,
    error,
    bulkCreateSales: bulkCreateMutation.mutateAsync,
  };
}
