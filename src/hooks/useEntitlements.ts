import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classEntitlementsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface ClassEntitlement {
  id: string;
  class_id: string;
  inventory_item_id: string;
  session_term_id: string;
  quantity: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Populated fields for display
  className?: string;
  itemName?: string;
  sessionName?: string;
  // Nested objects from API response
  inventory_items?: {
    id: string;
    name: string;
    categories?: {
      id: string;
      name: string;
    };
  };
  academic_session_terms?: {
    id: string;
    name: string;
  };
  school_classes?: {
    id: string;
    name: string;
  };
}

export function useEntitlements(params?: {
  class_id?: string;
  session_term_id?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rawEntitlements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["class-entitlements", params],
    queryFn: () => classEntitlementsApi.list(params),
  });

  // Transform backend data to frontend format
  const entitlements: ClassEntitlement[] = rawEntitlements.map(
    (entitlement: any) => ({
      id: entitlement.id,
      class_id: entitlement.class_id,
      inventory_item_id: entitlement.inventory_item_id,
      session_term_id: entitlement.session_term_id,
      quantity: entitlement.quantity,
      notes: entitlement.notes,
      created_by: entitlement.created_by,
      created_at: entitlement.created_at,
      updated_at: entitlement.updated_at,
      // Populate display names from nested objects
      className: entitlement.school_classes?.name || "No Class",
      itemName: entitlement.inventory_items?.name || "Unknown Item",
      sessionName: entitlement.academic_session_terms?.name || "No Session",
      // Include nested objects for additional data access
      inventory_items: entitlement.inventory_items,
      academic_session_terms: entitlement.academic_session_terms,
      school_classes: entitlement.school_classes,
    })
  );

  const addMutation = useMutation({
    mutationFn: classEntitlementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-entitlements"] });
      toast({
        title: "Success",
        description: "Entitlement added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add entitlement",
        variant: "destructive",
      });
    },
  });

  const bulkUpsertMutation = useMutation({
    mutationFn: classEntitlementsApi.bulkUpsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-entitlements"] });
      toast({
        title: "Success",
        description: "Entitlements updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update entitlements",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ClassEntitlement>;
    }) => classEntitlementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-entitlements"] });
      toast({
        title: "Success",
        description: "Entitlement updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update entitlement",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classEntitlementsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-entitlements"] });
      toast({
        title: "Success",
        description: "Entitlement deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete entitlement",
        variant: "destructive",
      });
    },
  });

  const addEntitlement = (entitlement: {
    class_id: string;
    inventory_item_id: string;
    session_term_id: string;
    quantity: number;
    notes?: string;
  }) => {
    addMutation.mutate(entitlement);
  };

  const addMultipleEntitlements = (
    newEntitlements: {
      class_id: string;
      inventory_item_id: string;
      session_term_id: string;
      quantity: number;
      notes?: string;
    }[]
  ) => {
    bulkUpsertMutation.mutate(newEntitlements);
  };

  const updateEntitlement = (
    id: string,
    updates: Partial<ClassEntitlement>
  ) => {
    updateMutation.mutate({ id, data: updates });
  };

  const deleteEntitlement = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getEntitlementsByClass = (classId: string) => {
    return entitlements.filter(
      (entitlement) => entitlement.class_id === classId
    );
  };

  const getEntitlementsBySession = (sessionId: string) => {
    return entitlements.filter(
      (entitlement) => entitlement.session_term_id === sessionId
    );
  };

  return {
    entitlements,
    isLoading,
    error,
    addEntitlement,
    addMultipleEntitlements,
    updateEntitlement,
    deleteEntitlement,
    getEntitlementsByClass,
    getEntitlementsBySession,
  };
}
