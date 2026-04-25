import { useState, useEffect } from "react";
import { categoryApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  itemCount: number;
  createdAt: string;
}

function normalizeStatus(status: unknown): "active" | "inactive" {
  if (typeof status !== "string") return "active";
  return status.toLowerCase() === "inactive" ? "inactive" : "active";
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await categoryApi.list();
        const list = res?.data?.categories;

        if (!Array.isArray(list))
          throw new Error("Invalid categories response");

        const mapped: Category[] = list.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          status: normalizeStatus(item.status),
          itemCount: item.itemCount ?? 0,
          createdAt: item.createdAt ?? new Date().toISOString().split("T")[0],
        }));

        if (mounted) setCategories(mapped);
      } catch (err) {
        if (mounted) setCategories([]);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const addCategory = async (
    categoryData: Omit<Category, "id" | "createdAt" | "itemCount">
  ) => {
    try {
      const res = await categoryApi.create({
        name: categoryData.name,
        description: categoryData.description,
      });
      const data = res?.data;
      if (!data?.id) throw new Error(res?.message || "Failed to add category");
      const newCategory: Category = {
        id: data.id,
        name: data.name,
        description: data.description ?? "",
        status: normalizeStatus(data.status),
        itemCount: 0,
        createdAt: data.createdAt ?? new Date().toISOString().split("T")[0],
      };
      setCategories((prev) => [...prev, newCategory]);
      toast({
        title: "Success",
        description: res?.message || "Category added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const res = await categoryApi.update(id, {
        name: updates.name,
        description: updates.description,
      });
      const data = res?.data;
      if (!data?.id)
        throw new Error(res?.message || "Failed to update category");
      const updated: Partial<Category> = {
        name: data.name,
        description: data.description ?? "",
      };

      setCategories((prev) =>
        prev.map((category) =>
          category.id === id
            ? ({ ...category, ...updated } as Category)
            : category
        )
      );
      toast({
        title: "Success",
        description: res?.message || "Category updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
