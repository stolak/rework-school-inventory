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

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await categoryApi.list();
        if (!Array.isArray(data))
          throw new Error("Invalid categories response");

        const mapped: Category[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          status: "active",
          itemCount: item.item_count ?? 0,
          createdAt: item.created_at ?? new Date().toISOString().split("T")[0],
        }));

        if (mounted) setCategories(mapped);
      } catch (err) {
        if (mounted) setCategories([]);
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
      const data = await categoryApi.create({
        name: categoryData.name,
        description: categoryData.description,
      });
      const newCategory: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        status: "active",
        itemCount: data.item_count ?? 0,
        createdAt: data.created_at ?? new Date().toISOString().split("T")[0],
      };
      setCategories((prev) => [...prev, newCategory]);
      toast({
        title: "Success",
        description: "Category added successfully",
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
      const data = await categoryApi.update(id, {
        name: updates.name,
        description: updates.description,
      });
      const updated: Partial<Category> = {
        name: data.name,
        description: data.description,
        itemCount: data.item_count ?? undefined,
        createdAt: data.created_at ?? undefined,
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
        description: "Category updated successfully",
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
