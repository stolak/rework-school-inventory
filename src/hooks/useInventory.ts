import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi, type UpdateInventoryItemBody } from "@/lib/api";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  sku?: string | null;
  name: string;
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  uomId?: string;
  barcode?: string | null;
  costPrice?: string | number;
  sellingPrice?: string | number;
  lowStockThreshold?: number;
  currentStock?: string | number | null;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: "Active" | "Inactive" | string;
  // Relations
  category?: { name?: string } | null;
  subCategory?: { name?: string } | null;
  brand?: { name?: string } | null;
  uom?: { name?: string; symbol?: string } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
}

export function useInventory(params?: {
  q?: string;
  status?: "Active" | "Inactive" | "All";
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: [
      "inventory",
      params?.q ?? "",
      params?.status ?? null,
      params?.categoryId ?? null,
      params?.subCategoryId ?? null,
      params?.brandId ?? null,
      params?.page ?? 1,
      params?.limit ?? 100,
    ],
    queryFn: async () => {
      const res = await inventoryApi.list({
        q: params?.q,
        status: params?.status,
        categoryId: params?.categoryId,
        subCategoryId: params?.subCategoryId,
        brandId: params?.brandId,
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
      });
      return res.data.inventoryItems;
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: any) =>
      inventoryApi.create({
        ...data,
        status: data?.status ?? "Active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryItemBody }) =>
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
    updateItem: (id: string, data: UpdateInventoryItemBody) =>
      updateMutation.mutate({ id, data }),
    deleteItem: (id: string) => deleteMutation.mutate(id),
  };
}