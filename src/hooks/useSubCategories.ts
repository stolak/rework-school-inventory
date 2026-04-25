import { useState, useEffect } from "react";
import { subCategoryApi } from "@/lib/api";

export interface SubCategory {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    status?: string;
  };
  createdAt: string;
}

export const useSubCategories = () => {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res: any = await subCategoryApi.list();
        const list = Array.isArray(res)
          ? res
          : res?.data?.subCategories ??
            res?.data?.sub_categories ??
            res?.data?.subcategories ??
            res?.data;

        if (!Array.isArray(list))
          throw new Error("Invalid sub-categories response");

        const mapped: SubCategory[] = list.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          categoryId: item.categoryId ?? item.category_id ?? "",
          category: item.category ?? item.categories ?? undefined,
          createdAt:
            item.createdAt ??
            item.created_at ??
            new Date().toISOString().split("T")[0],
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
    const res: any = await subCategoryApi.create({
      name: subCategoryData.name,
      description: subCategoryData.description,
      categoryId: subCategoryData.categoryId,
    });
    const data = res?.data ?? res;
    const newSubCategory: SubCategory = {
      id: data.id,
      name: data.name,
      description: data.description ?? "",
      categoryId: data.categoryId ?? data.category_id ?? "",
      category: data.category ?? data.categories ?? undefined,
      createdAt:
        data.createdAt ?? data.created_at ?? new Date().toISOString().split("T")[0],
    };
    setSubCategories((prev) => [...prev, newSubCategory]);
  };

  const updateSubCategory = async (
    id: string,
    updates: Partial<SubCategory>
  ) => {
    const payload: any = {
      name: updates.name,
      description: updates.description,
    };
    if (updates.categoryId) {
      payload.categoryId = updates.categoryId;
      payload.category_id = updates.categoryId;
    }

    const res: any = await subCategoryApi.update(id, payload);
    const data = res?.data ?? res;
    const updated: Partial<SubCategory> = {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId ?? data.category_id,
      createdAt: data.createdAt ?? data.created_at ?? undefined,
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
