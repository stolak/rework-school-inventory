import { useState, useEffect } from "react";
import { brandApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Brand {
  id: string;
  name: string;
  createdAt: string;
}

export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await brandApi.list();
        if (!Array.isArray(data)) throw new Error("Invalid brands response");

        const mapped: Brand[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          createdAt: item.created_at ?? new Date().toISOString().split("T")[0],
        }));

        if (mounted) setBrands(mapped);
      } catch (err) {
        if (mounted) setBrands([]);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const addBrand = async (brandData: Omit<Brand, "id" | "createdAt">) => {
    try {
      const data = await brandApi.create({
        name: brandData.name,
      });
      const newBrand: Brand = {
        id: data.id,
        name: data.name,
        createdAt: data.created_at ?? new Date().toISOString().split("T")[0],
      };
      setBrands((prev) => [...prev, newBrand]);
      toast({
        title: "Success",
        description: "Brand added successfully",
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
      const data = await brandApi.update(id, {
        name: updates.name,
      });
      const updated: Partial<Brand> = {
        name: data.name,
        createdAt: data.created_at ?? undefined,
      };

      setBrands((prev) =>
        prev.map((brand) =>
          brand.id === id ? ({ ...brand, ...updated } as Brand) : brand
        )
      );
      toast({
        title: "Success",
        description: "Brand updated successfully",
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
