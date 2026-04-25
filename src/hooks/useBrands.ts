import { useState, useEffect } from "react";
import { brandApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Brand {
  id: string;
  name: string;
  status?: "Active" | "Inactive" | string;
  createdAt: string;
}

export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await brandApi.list({ page: 1, limit: 20 });
        const list = res?.data?.brands;
        if (!Array.isArray(list)) throw new Error("Invalid brands response");

        const mapped: Brand[] = list.map((item: any) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          createdAt:
            item.createdAt ?? new Date().toISOString().split("T")[0],
        }));

        if (mounted) setBrands(mapped);
      } catch (err) {
        if (mounted) setBrands([]);
        toast({
          title: "Error",
          description: "Failed to load brands",
          variant: "destructive",
        });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const addBrand = async (brandData: Omit<Brand, "id" | "createdAt">) => {
    try {
      const res = await brandApi.create({
        name: brandData.name,
        status: brandData.status ?? "Active",
      });
      const data = res?.data;
      if (!data?.id) throw new Error(res?.message || "Failed to add brand");
      const newBrand: Brand = {
        id: data.id,
        name: data.name,
        status: data.status,
        createdAt: data.createdAt ?? new Date().toISOString().split("T")[0],
      };
      setBrands((prev) => [...prev, newBrand]);
      toast({
        title: "Success",
        description: res?.message || "Brand added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add brand",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    try {
      const res = await brandApi.update(id, {
        name: updates.name,
      });
      const data = res?.data;
      if (!data?.id) throw new Error(res?.message || "Failed to update brand");
      const updated: Partial<Brand> = {
        name: data.name,
        status: data.status,
        createdAt: data.createdAt ?? undefined,
      };

      setBrands((prev) =>
        prev.map((brand) =>
          brand.id === id ? ({ ...brand, ...updated } as Brand) : brand
        )
      );
      toast({
        title: "Success",
        description: res?.message || "Brand updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update brand",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBrand = async (id: string) => {
    try {
      await brandApi.remove(id);
      setBrands((prev) => prev.filter((brand) => brand.id !== id));
      toast({
        title: "Success",
        description: "Brand deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete brand",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    brands,
    addBrand,
    updateBrand,
    deleteBrand,
  };
};
