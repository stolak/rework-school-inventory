import { useQuery } from "@tanstack/react-query";
import { inventoryApi, type ItemBalanceRow } from "@/lib/api";

export function useItemBalances(params?: {
  categoryId?: string;
  subCategoryId?: string;
  storeId?: string;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["inventory-item-balances", params],
    queryFn: async () => {
      const res = await inventoryApi.balances(params);
      return (res?.data?.balances ?? []) as ItemBalanceRow[];
    },
  });

  return {
    balances: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
