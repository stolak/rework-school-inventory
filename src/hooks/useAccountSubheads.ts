import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccountHeads,
  fetchAccountSubheads,
  createAccountSubhead,
  updateAccountSubhead,
  deleteAccountSubhead,
  type AccountHead,
  type AccountSubhead,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function unwrapHeads(res: Awaited<ReturnType<typeof fetchAccountHeads>>): AccountHead[] {
  if (!res.success) throw new Error(res.message || "Failed to load account heads");
  const raw = res.data as unknown as {
    accountHeads?: AccountHead[];
    account_heads?: AccountHead[];
  };
  return raw?.accountHeads ?? raw?.account_heads ?? [];
}

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

export function useAccountHeads() {
  return useQuery({
    queryKey: ["account-heads"],
    queryFn: async () => unwrapHeads(await fetchAccountHeads()),
    staleTime: 60_000,
  });
}

export type CreateAccountSubheadInput = {
  headId: number;
  code: string;
  name: string;
  status: string;
  rank: number;
  paymentMethod: string;
};

export type UpdateAccountSubheadInput = {
  code?: string;
  name?: string;
  status?: string;
  rank?: number;
  paymentMethod?: string;
};

/** `"all"` loads every subhead (no `headId` query); a positive number filters by head. */
export type AccountSubheadsListFilter = "all" | number;

export function useAccountSubheads(headFilter: AccountSubheadsListFilter | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listQuery = useQuery({
    queryKey: ["account-subheads", headFilter],
    queryFn: async () => {
      if (headFilter === "all") {
        return unwrapSubheads(await fetchAccountSubheads());
      }
      if (typeof headFilter === "number" && headFilter > 0) {
        return unwrapSubheads(await fetchAccountSubheads({ headId: headFilter }));
      }
      return [];
    },
    enabled:
      headFilter === "all" ||
      (typeof headFilter === "number" && headFilter > 0),
  });

  const invalidateSubheadLists = () => {
    queryClient.invalidateQueries({ queryKey: ["account-subheads"] });
  };

  const createMutation = useMutation({
    mutationFn: (body: CreateAccountSubheadInput) => createAccountSubhead(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Account subhead created",
      });
      invalidateSubheadLists();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account subhead",
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
      data: UpdateAccountSubheadInput;
    }) => updateAccountSubhead(id, data),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Account subhead updated",
      });
      invalidateSubheadLists();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account subhead",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAccountSubhead(id),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Account subhead deleted",
      });
      invalidateSubheadLists();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account subhead",
        variant: "destructive",
      });
    },
  });

  return {
    subheads: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    refetch: listQuery.refetch,
    createSubhead: createMutation.mutateAsync,
    updateSubhead: updateMutation.mutateAsync,
    deleteSubhead: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export type { AccountHead, AccountSubhead };
