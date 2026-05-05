import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccountCharts,
  createAccountChart,
  updateAccountChart,
  deleteAccountChart,
  type AccountChart,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type AccountChartListFilters = {
  groupId?: number;
  headId?: number;
  subheadId?: number;
  /** API expects e.g. `All`, `Active`, `Inactive` */
  status: string;
};

function unwrapCharts(
  res: Awaited<ReturnType<typeof fetchAccountCharts>>
): AccountChart[] {
  if (!res.success) throw new Error(res.message || "Failed to load account charts");
  const raw = res.data as unknown as {
    accountCharts?: AccountChart[];
    account_charts?: AccountChart[];
  };
  return raw?.accountCharts ?? raw?.account_charts ?? [];
}

export type CreateAccountChartInput = {
  subheadId: number;
  accountDescription: string;
  accountNo?: string;
  rank: number;
};

export type UpdateAccountChartInput = {
  subheadId?: number;
  accountDescription?: string;
  accountNo?: string;
  status?: string;
  rank?: number;
};

export function useAccountCharts(filters: AccountChartListFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listQuery = useQuery({
    queryKey: ["account-charts", filters],
    queryFn: async () =>
      unwrapCharts(
        await fetchAccountCharts({
          groupId: filters.groupId,
          headId: filters.headId,
          subheadId: filters.subheadId,
          status: filters.status,
        })
      ),
  });

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ["account-charts"] });
    queryClient.invalidateQueries({ queryKey: ["account-groups"] });
  };

  const createMutation = useMutation({
    mutationFn: (body: CreateAccountChartInput) => createAccountChart(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Account chart created",
      });
      invalidateLists();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account chart",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateAccountChartInput;
    }) => updateAccountChart(id, data),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Account chart updated",
      });
      invalidateLists();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account chart",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAccountChart(id),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Account chart deleted",
      });
      invalidateLists();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account chart",
        variant: "destructive",
      });
    },
  });

  return {
    charts: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    refetch: listQuery.refetch,
    createChart: createMutation.mutateAsync,
    updateChart: updateMutation.mutateAsync,
    deleteChart: deleteMutation.mutateAsync,
  };
}

export type { AccountChart };
