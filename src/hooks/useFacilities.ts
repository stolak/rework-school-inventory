import { useState, useEffect, useCallback } from "react";
import { facilityApi, type Facility as ApiFacility } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Facility {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  createdByName: string;
  transactionCount: number;
}

function normalizeStatus(status: unknown): "active" | "inactive" {
  if (typeof status !== "string") return "active";
  return status.toLowerCase() === "inactive" ? "inactive" : "active";
}

function toApiStatus(status: "active" | "inactive"): "Active" | "Inactive" {
  return status === "inactive" ? "Inactive" : "Active";
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function createdByDisplay(item: ApiFacility): string {
  const by = item.CreatedBy;
  if (!by) return "—";
  const name = [by.firstName, by.lastName].filter(Boolean).join(" ").trim();
  return name || by.email || "—";
}

function mapFacility(item: ApiFacility): Facility {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    status: normalizeStatus(item.status),
    createdAt: formatDate(item.createdAt),
    createdByName: createdByDisplay(item),
    transactionCount: item._count?.inventoryTransactions ?? 0,
  };
}

export type FacilityCreateInput = {
  name: string;
  description: string;
};

export type FacilityUpdateInput = {
  name?: string;
  description?: string;
  status?: "active" | "inactive";
};

export const useFacilities = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadFacilities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await facilityApi.list({ status: "Active", page: 1, limit: 100 });
      const list = res?.data?.facilities;
      if (!Array.isArray(list)) throw new Error("Invalid facilities response");
      setFacilities(list.map((item) => mapFacility(item)));
    } catch {
      setFacilities([]);
      toast({
        title: "Error",
        description: "Failed to load facilities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const addFacility = async (data: FacilityCreateInput) => {
    try {
      const res = await facilityApi.create({
        name: data.name,
        description: data.description,
      });
      const item = res?.data;
      if (!item?.id) throw new Error(res?.message || "Failed to add facility");

      setFacilities((prev) => [...prev, mapFacility(item)]);
      toast({
        title: "Success",
        description: res?.message || "Facility added successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add facility";
      toast({ title: "Error", description: message, variant: "destructive" });
      throw error;
    }
  };

  const updateFacility = async (id: string, updates: FacilityUpdateInput) => {
    try {
      const body: {
        name?: string;
        description?: string;
        status?: "Active" | "Inactive";
      } = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.status !== undefined) body.status = toApiStatus(updates.status);

      const res = await facilityApi.update(id, body);
      const item = res?.data;
      if (!item?.id) throw new Error(res?.message || "Failed to update facility");

      const mapped = mapFacility(item);
      setFacilities((prev) => prev.map((f) => (f.id === id ? mapped : f)));
      toast({
        title: "Success",
        description: res?.message || "Facility updated successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update facility";
      toast({ title: "Error", description: message, variant: "destructive" });
      throw error;
    }
  };

  const deleteFacility = async (id: string) => {
    try {
      await facilityApi.remove(id);
      setFacilities((prev) => prev.filter((f) => f.id !== id));
      toast({
        title: "Success",
        description: "Facility deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete facility";
      toast({ title: "Error", description: message, variant: "destructive" });
      throw error;
    }
  };

  return {
    facilities,
    isLoading,
    refetch: loadFacilities,
    addFacility,
    updateFacility,
    deleteFacility,
  };
};
