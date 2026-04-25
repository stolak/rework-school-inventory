import { useState, useEffect } from "react";
import { uomApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Uom {
  id: string;
  name: string;
  symbol: string;
  status?: "Active" | "Inactive" | string;
  createdAt: string;
}

export function useUoms() {
  const [uoms, setUoms] = useState<Uom[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadUoms = async () => {
      try {
        const res = await uomApi.list({ page: 1, limit: 20 });
        const list = res?.data?.uoms;
        if (!Array.isArray(list)) throw new Error("Invalid UOM response");

        const mapped = list.map((item: any) => ({
          id: item.id,
          name: item.name,
          symbol: item.symbol,
          status: item.status,
          createdAt: new Date(item.createdAt).toLocaleDateString(),
        }));
        setUoms(mapped);
      } catch (error) {
        console.error("Failed to fetch UOMs:", error);
        toast({
          title: "Error",
          description: "Failed to load units of measurement",
          variant: "destructive",
        });
      }
    };

    loadUoms();
  }, [toast]);

  const addUom = async (uomData: Omit<Uom, "id" | "createdAt">) => {
    const res = await uomApi.create({
      name: uomData.name,
      symbol: uomData.symbol,
      status: uomData.status ?? "Active",
    });
    const newUom = res?.data;
    if (!newUom?.id) throw new Error(res?.message || "Failed to create UOM");

    setUoms((prev) => [
      ...prev,
      {
        id: newUom.id,
        name: newUom.name,
        symbol: newUom.symbol,
        status: newUom.status,
        createdAt: new Date(newUom.createdAt).toLocaleDateString(),
      },
    ]);

    toast({
      title: "Success",
      description: res?.message || "Unit of measurement added successfully",
    });
  };

  const updateUom = async (id: string, updates: Partial<Uom>) => {
    const res = await uomApi.update(id, {
      name: updates.name,
      symbol: updates.symbol,
    });
    const updated = res?.data;
    if (!updated?.id) throw new Error(res?.message || "Failed to update UOM");

    setUoms((prev) =>
      prev.map((uom) =>
        uom.id === id
          ? {
              ...uom,
              name: updated.name,
              symbol: updated.symbol,
            }
          : uom
      )
    );

    toast({
      title: "Success",
      description: res?.message || "Unit of measurement updated successfully",
    });
  };

  const deleteUom = async (id: string) => {
    await uomApi.remove(id);
    setUoms((prev) => prev.filter((uom) => uom.id !== id));
    toast({
      title: "Success",
      description: "Unit of measurement deleted successfully",
    });
  };

  return { uoms, addUom, updateUom, deleteUom };
}
