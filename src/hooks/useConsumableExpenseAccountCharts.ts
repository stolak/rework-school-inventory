import { useQuery } from "@tanstack/react-query";
import { categoryApi, type AccountChart } from "@/lib/api";

function unwrapCharts(res: Awaited<ReturnType<typeof categoryApi.consumableExpenseAccountCharts>>) {
  if (!res?.success) {
    throw new Error(res?.message || "Failed to load expense GL accounts");
  }
  return res.data?.accountCharts ?? [];
}

export function useConsumableExpenseAccountCharts() {
  const query = useQuery({
    queryKey: ["consumable-expense-account-charts"],
    queryFn: async () => unwrapCharts(await categoryApi.consumableExpenseAccountCharts()),
    staleTime: 60_000,
  });

  return {
    accountCharts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function consumableAccountChartLabel(chart: AccountChart): string {
  const no = chart.accountNo?.trim();
  return no ? `${no} — ${chart.accountDescription}` : chart.accountDescription;
}
