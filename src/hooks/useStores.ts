import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storeApi, type StoreRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type StoreListItem = StoreRow & {
  managerDisplayName?: string;
  transactionCount?: number;
};

function normalizeStore(s: StoreRow): StoreListItem {
  const m = s.manager;
  const managerDisplayName = m
    ? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email || undefined
    : undefined;
  const transactionCount = s._count?.inventoryTransactions;

  return {
    ...s,
    managerDisplayName,
    transactionCount,
  };
}

export function useStores(params?: { page?: number; limit?: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["stores", page, limit],
    queryFn: () => storeApi.list({ page, limit }),
  });

  const rawStores = (response as any)?.data?.stores ?? [];
  const pagination = (response as any)?.data?.pagination;

  const stores: StoreListItem[] = rawStores.map((s: StoreRow) =>
    normalizeStore(s)
  );

  const createMutation = useMutation({
    mutationFn: storeApi.create,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast({
        title: "Success",
        description: res?.message || "Store created successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create store",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof storeApi.update>[1];
    }) => storeApi.update(id, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast({
        title: "Success",
        description: res?.message || "Store updated successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update store",
        variant: "destructive",
      });
    },
  });

  return {
    stores,
    pagination,
    isLoading,
    error,
    createStore: createMutation.mutateAsync,
    updateStore: (id: string, data: Parameters<typeof storeApi.update>[1]) =>
      updateMutation.mutateAsync({ id, data }),
  };
}
