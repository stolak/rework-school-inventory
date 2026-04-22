import { useState, useEffect } from "react";
import { subCategoryApi } from "@/lib/api";

export interface SubCategory {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categories?: {
    id: string;
    name: string;
  };
  categoryName?: string;
  createdAt: string;
}

export const useSubCategories = () => {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await subCategoryApi.list();
        if (!Array.isArray(data))
          throw new Error("Invalid sub-categories response");

        const mapped: SubCategory[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          categoryId: item.category_id ?? "",
          categoryName: item?.categories?.name ?? "",
          createdAt: item.created_at ?? new Date().toISOString().split("T")[0],
        }));

        if (mounted) setSubCategories(mapped);
      } catch (err) {
        if (mounted) setSubCategories([]);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const addSubCategory = async (
    subCategoryData: Omit<SubCategory, "id" | "createdAt" | "categoryName">
  ) => {
    const data = await subCategoryApi.create({
      name: subCategoryData.name,
      description: subCategoryData.description,
      category_id: subCategoryData.categoryId,
    });
    const newSubCategory: SubCategory = {
      id: data.id,
      name: data.name,
      description: data.description,
      categoryId: data.category_id,
      categoryName: data.category_name ?? "",
      createdAt: data.created_at ?? new Date().toISOString().split("T")[0],
    };
    setSubCategories((prev) => [...prev, newSubCategory]);
  };

  const updateSubCategory = async (
    id: string,
    updates: Partial<SubCategory>
  ) => {
    const data = await subCategoryApi.update(id, {
      name: updates.name,
      description: updates.description,
      category_id: updates.categoryId,
    });
    const updated: Partial<SubCategory> = {
      name: data.name,
      description: data.description,
      categoryId: data.category_id,
      categoryName: data.category_name ?? undefined,
      createdAt: data.created_at ?? undefined,
    };

    setSubCategories((prev) =>
      prev.map((subCategory) =>
        subCategory.id === id
          ? ({ ...subCategory, ...updated } as SubCategory)
          : subCategory
      )
    );
  };

  const deleteSubCategory = async (id: string) => {
    await subCategoryApi.remove(id);
    setSubCategories((prev) =>
      prev.filter((subCategory) => subCategory.id !== id)
    );
  };

  return {
    subCategories,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
  };
};
