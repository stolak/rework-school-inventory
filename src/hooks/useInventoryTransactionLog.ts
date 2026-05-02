import { useQuery } from "@tanstack/react-query";
import {
  inventoryApi,
  type InventoryTransactionLogData,
  type InventoryTxnLogRow,
} from "@/lib/api";

export type TransactionLogRowWithBalance = InventoryTxnLogRow & {
  /** Balance after applying this transaction (running total) */
  balanceAfter: number;
};

/** Sort chronologically, then apply opening balance and cumulative qty in − out. */
export function computeRunningBalances(
  openingBalance: string,
  transactions: InventoryTxnLogRow[]
): TransactionLogRowWithBalance[] {
  const sorted = [...transactions].sort((a, b) => {
    const ta = new Date(a.transactionDate).getTime();
    const tb = new Date(b.transactionDate).getTime();
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });

  let running = Number(openingBalance ?? 0);
  return sorted.map((t) => {
    const inQ = Number(t.qtyIn ?? 0);
    const outQ = Number(t.qtyOut ?? 0);
    running = running + inQ - outQ;
    return { ...t, balanceAfter: running };
  });
}

export function useInventoryTransactionLog(params: {
  itemId: string;
  storeId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
} | null) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["inventory-item-transaction-log", params],
    queryFn: async () => {
      if (!params?.itemId) return null;
      const res = await inventoryApi.transactionLog({
        itemId: params.itemId,
        storeId: params.storeId,
        transactionDateFrom: params.transactionDateFrom,
        transactionDateTo: params.transactionDateTo,
      });
      return (res?.data ?? null) as InventoryTransactionLogData | null;
    },
    enabled: Boolean(params?.itemId),
  });

  return {
    log: data,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
