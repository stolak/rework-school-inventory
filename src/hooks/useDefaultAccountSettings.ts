import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDefaultAccountSettings,
  updateDefaultAccountSetting,
  type AccountChart,
  type DefaultAccountSetting,
} from "@/lib/api";
import { useAccountCharts } from "@/hooks/useAccountCharts";
import { useToast } from "@/hooks/use-toast";

function unwrapSettings(
  res: Awaited<ReturnType<typeof fetchDefaultAccountSettings>>
): DefaultAccountSetting[] {
  if (!res.success) throw new Error(res.message || "Failed to load default account settings");
  return Array.isArray(res.data) ? res.data : [];
}

export function accountChartOptionLabel(a: AccountChart): string {
  const no = a.accountNo?.trim();
  const desc = a.accountDescription?.trim() || "Account";
  const sub = a.subhead?.name;
  const parts = [no ? `${no} — ${desc}` : desc, sub ? `(${sub})` : null].filter(Boolean);
  return parts.join(" ");
}

export function useDefaultAccountSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const settingsQuery = useQuery({
    queryKey: ["default-account-settings"],
    queryFn: async () => unwrapSettings(await fetchDefaultAccountSettings()),
    staleTime: 30_000,
  });

  const { charts: activeCharts, isLoading: isLoadingCharts } = useAccountCharts({
    status: "Active",
  });

  const updateMutation = useMutation({
    mutationFn: ({
      settingsId,
      accountId,
    }: {
      settingsId: string;
      accountId: number;
    }) => updateDefaultAccountSetting(settingsId, { accountId }),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Default account updated",
      });
      queryClient.invalidateQueries({ queryKey: ["default-account-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  return {
    settings: settingsQuery.data ?? [],
    isLoadingSettings: settingsQuery.isLoading,
    isFetchingSettings: settingsQuery.isFetching,
    refetchSettings: settingsQuery.refetch,
    activeCharts,
    isLoadingCharts,
    updateSetting: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
