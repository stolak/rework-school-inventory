import { useState, useEffect } from "react";
import { uomApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Uom {
  id: string;
  name: string;
  symbol: string;
  createdAt: string;
}

export function useUoms() {
  const [uoms, setUoms] = useState<Uom[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadUoms = async () => {
      try {
        const data = await uomApi.list();
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          symbol: item.symbol,
          createdAt: new Date(item.created_at).toLocaleDateString(),
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
    const newUom = await uomApi.create({
      name: uomData.name,
      symbol: uomData.symbol,
    });

    setUoms((prev) => [
      ...prev,
      {
        id: newUom.id,
        name: newUom.name,
        symbol: newUom.symbol,
        createdAt: new Date(newUom.created_at).toLocaleDateString(),
      },
    ]);

    toast({
      title: "Success",
      description: "Unit of measurement added successfully",
    });
  };

  const updateUom = async (id: string, updates: Partial<Uom>) => {
    const updated = await uomApi.update(id, {
      name: updates.name,
      symbol: updates.symbol,
    });

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
      description: "Unit of measurement updated successfully",
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
