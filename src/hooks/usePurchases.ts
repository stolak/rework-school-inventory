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
    mutationFn: purchaseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({ title: "Success", description: "Purchase created successfully" });
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
    mutationFn: purchaseApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Success",
        description: "Purchases created successfully",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({ title: "Success", description: "Purchase updated successfully" });
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
    mutationFn: purchaseApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({ title: "Success", description: "Purchase deleted successfully" });
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

