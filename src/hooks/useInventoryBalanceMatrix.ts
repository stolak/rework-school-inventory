import { useMutation } from "@tanstack/react-query";
import { inventoryApi, type InventoryBalanceMatrixRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type BalanceMatrixFilters = {
  stores?: string[];
  items?: string[];
  categoryId?: string;
  subCategoryId?: string;
};

export function useInventoryBalanceMatrix() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (filters: BalanceMatrixFilters) => {
      const res = await inventoryApi.balanceMatrix(filters);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load balance matrix");
      }
      return res.data ?? [];
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e.message || "Failed to load balance matrix",
        variant: "destructive",
      });
    },
  });

  return {
    rows: (mutation.data ?? []) as InventoryBalanceMatrixRow[],
    isLoading: mutation.isPending,
    run: mutation.mutateAsync,
  };
}

