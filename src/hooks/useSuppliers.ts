import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  notes?: string | null;
  status?: "Active" | "Inactive" | string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { firstName?: string; lastName?: string };
}

export const useSuppliers = (params?: {
  status?: "Active" | "Inactive";
  page?: number;
  limit?: number;
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ["suppliers", params?.status ?? null, params?.page ?? 1, params?.limit ?? 20],
    queryFn: async () => {
      const res = await supplierApi.list({
        status: params?.status,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      });
      return res.data.suppliers;
    },
  });

  const addMutation = useMutation({
    mutationFn: supplierApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Success",
        description: "Supplier added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add supplier",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      supplierApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: supplierApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  return {
    suppliers,
    isLoading,
    error,
    addSupplier: addMutation.mutate,
    updateSupplier: (id: string, data: Partial<Supplier>) =>
      updateMutation.mutate({ id, data }),
    deleteSupplier: deleteMutation.mutate,
  };
};