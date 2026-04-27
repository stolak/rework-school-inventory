import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purchaseApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Purchase {
  id: string;
  itemId: string;
  supplierId: string | null;
  qtyIn: string;
  inCost: string;
  amountPaid: string;
  status: "pending" | "completed" | "cancelled" | string;
  referenceNo: string | null;
  notes: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  item?: { name?: string } | null;
  supplier?: { name?: string } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
}

export function usePurchases(params?: { page?: number; limit?: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: purchases = [], isLoading, error } = useQuery({
    queryKey: ["purchases", params?.page ?? 1, params?.limit ?? 20],
    queryFn: async () => {
      const res = await purchaseApi.list({
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      });
      return res.data.purchases as Purchase[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await purchaseApi.create(body);
      if (!res?.success) throw new Error(res?.message || "Failed to create purchase");
      return res;
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Success",
        description: res?.message || "Purchase created successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create purchase",
        variant: "destructive",
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await purchaseApi.bulkCreate(body);
      if (!res?.success)
        throw new Error(res?.message || "Failed to create purchases");
      return res;
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Success",
        description: res?.message || "Purchases created successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create purchases",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      purchaseApi.update(id, data),
    onSuccess: (res: any) => {
      if (!res?.success) throw new Error(res?.message || "Failed to update purchase");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Success",
        description: res?.message || "Purchase updated successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update purchase",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await purchaseApi.remove(id);
      if (!res?.success) throw new Error(res?.message || "Failed to delete purchase");
      return res;
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Success",
        description: res?.message || "Purchase deleted successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete purchase",
        variant: "destructive",
      });
    },
  });

  return {
    purchases,
    isLoading,
    error,
    addPurchase: addMutation.mutateAsync,
    bulkCreatePurchases: bulkCreateMutation.mutateAsync,
    updatePurchase: (id: string, data: any) => updateMutation.mutateAsync({ id, data }),
    deletePurchase: deleteMutation.mutateAsync,
  };
}

