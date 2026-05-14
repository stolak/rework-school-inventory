import { useQuery } from "@tanstack/react-query";
import {
  accountTransactionsApi,
  type AccountTransactionLogData,
  type AccountTransactionLogRow,
} from "@/lib/api";

export type AccountTxnRowWithBalance = AccountTransactionLogRow & {
  balanceAfter: number;
};

/** Sort by date, then id; running balance = opening + debit − credit per line. */
export function computeRunningAccountBalances(
  openingBalance: string,
  transactions: AccountTransactionLogRow[]
): AccountTxnRowWithBalance[] {
  const sorted = [...transactions].sort((a, b) => {
    const ta = new Date(a.transactionDate).getTime();
    const tb = new Date(b.transactionDate).getTime();
    if (ta !== tb) return ta - tb;
    return a.id - b.id;
  });

  let running = Number(openingBalance ?? 0);
  return sorted.map((t) => {
    const d = Number(t.debit ?? 0);
    const c = Number(t.credit ?? 0);
    running = running + d - c;
    return { ...t, balanceAfter: running };
  });
}

export function useAccountTransactionLog(
  params: {
    accountId: number;
    transactionDateFrom?: string;
    transactionDateTo?: string;
  } | null
) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["account-transaction-log", params],
    queryFn: async () => {
      if (params == null || !Number.isFinite(params.accountId)) return null;
      const res = await accountTransactionsApi.transactionLog({
        accountId: params.accountId,
        transactionDateFrom: params.transactionDateFrom,
        transactionDateTo: params.transactionDateTo,
      });
      if (!res?.success) throw new Error(res?.message || "Failed to load account log");
      return res.data as AccountTransactionLogData;
    },
    enabled: params != null && Number.isFinite(params.accountId),
    staleTime: 15_000,
  });

  return {
    log: data,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
