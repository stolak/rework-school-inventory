import { useState, useEffect, useCallback } from "react";
import {
  categoryApi,
  type Category as ApiCategory,
  type CategoryType,
} from "@/lib/api";

export type { CategoryType } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type CategoryConsumableAccount = {
  id: number;
  accountNo?: string | null;
  accountDescription: string;
};

export interface Category {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  categoryType: CategoryType;
  itemCount: number;
  createdAt: string;
  consumableAccountId: number | null;
  consumableAccount: CategoryConsumableAccount | null;
}

function normalizeCategoryType(value: unknown): CategoryType {
  if (value === "NonConsumable") return "NonConsumable";
  return "Consumable";
}

function normalizeStatus(status: unknown): "active" | "inactive" {
  if (typeof status !== "string") return "active";
  return status.toLowerCase() === "inactive" ? "inactive" : "active";
}

function toApiCategoryStatus(status: "active" | "inactive"): "Active" | "Inactive" {
  return status === "inactive" ? "Inactive" : "Active";
}

function mapCategory(item: ApiCategory & { itemCount?: number }): Category {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    status: normalizeStatus(item.status),
    categoryType: normalizeCategoryType(item.categoryType),
    itemCount: item.itemCount ?? 0,
    createdAt: item.createdAt ?? new Date().toISOString().split("T")[0],
    consumableAccountId: item.consumableAccountId ?? null,
    consumableAccount: item.consumableAccount ?? null,
  };
}

export type CategoryCreateInput = {
  name: string;
  description: string;
  categoryType: CategoryType;
  consumableAccountId?: number | null;
};

export type CategoryUpdateInput = {
  name?: string;
  description?: string;
  categoryType?: CategoryType;
  status?: "active" | "inactive";
  consumableAccountId?: number | null;
};

export type UseCategoriesOptions = {
  categoryType?: CategoryType;
};

export const useCategories = (options?: UseCategoriesOptions) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await categoryApi.list({
        status: "Active",
        ...(options?.categoryType ? { categoryType: options.categoryType } : {}),
        page: 1,
        limit: 100,
      });
      const list = res?.data?.categories;

      if (!Array.isArray(list)) throw new Error("Invalid categories response");

      setCategories(list.map((item) => mapCategory(item)));
    } catch {
      setCategories([]);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, options?.categoryType]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = async (categoryData: CategoryCreateInput) => {
    try {
      const body: {
        name: string;
        description?: string;
        categoryType: CategoryType;
        consumableAccountId?: number;
      } = {
        name: categoryData.name,
        description: categoryData.description,
        categoryType: categoryData.categoryType,
      };
      if (
        categoryData.categoryType === "Consumable" &&
        categoryData.consumableAccountId != null
      ) {
        body.consumableAccountId = categoryData.consumableAccountId;
      }

      const res = await categoryApi.create(body);
      const data = res?.data;
      if (!data?.id) throw new Error(res?.message || "Failed to add category");

      const newCategory = mapCategory(data);
      setCategories((prev) => [...prev, newCategory]);
      toast({
        title: "Success",
        description: res?.message || "Category added successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add category";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: CategoryUpdateInput) => {
    try {
      const body: {
        name?: string;
        description?: string;
        categoryType?: CategoryType;
        status?: "Active" | "Inactive";
        consumableAccountId?: number | null;
      } = {};

      if (updates.name !== undefined) body.name = updates.name;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.categoryType !== undefined) body.categoryType = updates.categoryType;
      if (updates.status !== undefined) {
        body.status = toApiCategoryStatus(updates.status);
      }
      if (updates.consumableAccountId !== undefined) {
        body.consumableAccountId = updates.consumableAccountId;
      }

      const res = await categoryApi.update(id, body);
      const data = res?.data;
      if (!data?.id) throw new Error(res?.message || "Failed to update category");

      const updated = mapCategory(data);
      setCategories((prev) =>
        prev.map((category) => (category.id === id ? updated : category))
      );
      toast({
        title: "Success",
        description: res?.message || "Category updated successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update category";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryApi.remove(id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete category";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    categories,
    isLoading,
    refetch: loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
