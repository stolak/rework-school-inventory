import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingItemsApi, type BillingItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type BillingItemsListParams = {
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type CreateBillingItemInput = {
  code: string;
  name: string;
  category: string;
  accountId: number;
  optional: boolean;
};

export type UpdateBillingItemInput = {
  code?: string;
  name?: string;
  category?: string;
  accountId?: number;
  optional?: boolean;
  status?: string;
};

export function useBillingItemCategories() {
  return useQuery({
    queryKey: ["billing-item-categories"],
    queryFn: async () => {
      const res = await billingItemsApi.categories();
      const list = res?.data;
      if (!Array.isArray(list)) return [];
      return list as string[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useBillingItems(params: BillingItemsListParams) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listQuery = useQuery({
    queryKey: ["billing-items", params],
    queryFn: () => billingItemsApi.list(params),
  });

  const billingItems: BillingItem[] = listQuery.data?.data?.billingItems ?? [];
  const pagination = listQuery.data?.data?.pagination ?? null;

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ["billing-items"] });
  };

  const createMutation = useMutation({
    mutationFn: (body: CreateBillingItemInput) => billingItemsApi.create(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Billing item created successfully",
      });
      invalidateLists();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create billing item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBillingItemInput }) =>
      billingItemsApi.update(id, data),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Billing item updated successfully",
      });
      invalidateLists();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update billing item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => billingItemsApi.remove(id),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Billing item deleted successfully",
      });
      invalidateLists();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete billing item",
        variant: "destructive",
      });
    },
  });

  return {
    billingItems,
    pagination,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createBillingItem: createMutation.mutateAsync,
    updateBillingItem: updateMutation.mutateAsync,
    deleteBillingItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

