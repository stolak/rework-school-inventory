import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  sku?: string;
  name: string;
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  uomId?: string;
  barcode?: string;
  costPrice?: string | number;
  sellingPrice?: string | number;
  lowStockThreshold?: number;
  currentStock?: string | number;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: "Active" | "Inactive" | string;
  // Relations
  category?: { id: string; name: string };
  subCategory?: { id: string; name: string };
  brand?: { id: string; name: string };
  uom?: { id: string; name: string; symbol?: string };
  createdBy?: { firstName?: string; lastName?: string };
}

export function useInventory() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await inventoryApi.list({ page: 1, limit: 100 });
      return res.data.inventoryItems;
    },
  });

  const addMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });

  return {
    items,
    isLoading,
    addItem: (data: any) => addMutation.mutate(data),
    updateItem: (id: string, data: any) => updateMutation.mutate({ id, data }),
    deleteItem: (id: string) => deleteMutation.mutate(id),
  };
}