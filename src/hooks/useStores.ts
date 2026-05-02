import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storeApi, type StoreAccessibleUser, type StoreRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type StoreAccessibleUserView = StoreAccessibleUser & {
  displayName: string;
  id: string;
};

export type StoreListItem = StoreRow & {
  managerDisplayName?: string;
  transactionCount?: number;
  accessibleUsersView: StoreAccessibleUserView[];
};

function mapAccessibleUser(u: StoreAccessibleUser): StoreAccessibleUserView {
  return {
    ...u,
    displayName:
      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
  };
}

function normalizeStore(s: StoreRow): StoreListItem {
  const m = s.manager;
  const managerDisplayName = m
    ? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email || undefined
    : undefined;
  const transactionCount = s._count?.inventoryTransactions;
  const raw = s.accessibleUsers ?? [];

  return {
    ...s,
    managerDisplayName,
    transactionCount,
    accessibleUsersView: raw.map(mapAccessibleUser),
  };
}

export function useStores(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["stores", page, limit, params?.status ?? null],
    queryFn: () =>
      storeApi.list({
        page,
        limit,
        status: params?.status,
      }),
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

  const addUserMutation = useMutation({
    mutationFn: ({
      storeId,
      userId,
    }: {
      storeId: string;
      userId: string;
    }) => storeApi.addUser(storeId, { userId }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast({
        title: "Success",
        description: res?.message || "User added to store",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to add user to store",
        variant: "destructive",
      });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: ({
      storeId,
      userId,
    }: {
      storeId: string;
      userId: string;
    }) => storeApi.removeUser(storeId, userId),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast({
        title: "Success",
        description: res?.message || "User removed from store",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to remove user from store",
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
    addUserToStore: (storeId: string, userId: string) =>
      addUserMutation.mutateAsync({ storeId, userId }),
    removeUserFromStore: (storeId: string, userId: string) =>
      removeUserMutation.mutateAsync({ storeId, userId }),
    isStoreAccessPending:
      addUserMutation.isPending || removeUserMutation.isPending,
  };
}
