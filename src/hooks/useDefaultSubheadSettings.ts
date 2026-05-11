import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccountSubheads,
  fetchDefaultSubheadSettings,
  updateDefaultSubheadSetting,
  type AccountSubhead,
  type DefaultSubheadSetting,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function unwrapSubheads(
  res: Awaited<ReturnType<typeof fetchAccountSubheads>>
): AccountSubhead[] {
  if (!res.success) throw new Error(res.message || "Failed to load account subheads");
  const raw = res.data as unknown as {
    accountSubheads?: AccountSubhead[];
    account_subheads?: AccountSubhead[];
  };
  return raw?.accountSubheads ?? raw?.account_subheads ?? [];
}

function unwrapSettings(
  res: Awaited<ReturnType<typeof fetchDefaultSubheadSettings>>
): DefaultSubheadSetting[] {
  if (!res.success) throw new Error(res.message || "Failed to load default subhead settings");
  return Array.isArray(res.data) ? res.data : [];
}

export function useDefaultSubheadSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const settingsQuery = useQuery({
    queryKey: ["default-subhead-settings"],
    queryFn: async () => unwrapSettings(await fetchDefaultSubheadSettings()),
    staleTime: 30_000,
  });

  const activeSubheadsQuery = useQuery({
    queryKey: ["account-subheads", { status: "Active" }],
    queryFn: async () =>
      unwrapSubheads(await fetchAccountSubheads({ status: "Active" })),
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      settingsId,
      subheadId,
    }: {
      settingsId: string;
      subheadId: number;
    }) => updateDefaultSubheadSetting(settingsId, { subheadId }),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Default subhead updated",
      });
      queryClient.invalidateQueries({ queryKey: ["default-subhead-settings"] });
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
    activeSubheads: activeSubheadsQuery.data ?? [],
    isLoadingSubheads: activeSubheadsQuery.isLoading,
    updateSetting: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
