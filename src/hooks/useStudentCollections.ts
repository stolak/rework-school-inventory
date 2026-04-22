import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentCollectionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface StudentCollection {
  id: string;
  student_id: string;
  class_id: string;
  session_term_id: string;
  inventory_item_id: string;
  qty: number;
  eligible: boolean;
  received: boolean;
  received_date?: string;
  given_by?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Populated fields for display
  studentName?: string;
  itemName?: string;
  sessionName?: string;
  // Nested objects from API response
  students?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
  };
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

export function useStudentCollections(params?: {
  class_id?: string;
  session_term_id?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rawCollections = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student-collections", params],
    queryFn: () => studentCollectionsApi.list(params),
  });

  // Transform backend data to frontend format
  const collections: StudentCollection[] = rawCollections.map(
    (collection: any) => ({
      id: collection.id,
      student_id: collection.student_id,
      class_id: collection.class_id,
      session_term_id: collection.session_term_id,
      inventory_item_id: collection.inventory_item_id,
      qty: collection.qty,
      eligible: collection.eligible,
      received: collection.received,
      received_date: collection.received_date,
      given_by: collection.given_by,
      created_by: collection.created_by,
      created_at: collection.created_at,
      updated_at: collection.updated_at,
      // Populate display names from nested objects
      studentName: collection.students
        ? `${collection.students.first_name} ${collection.students.last_name}`
        : "Unknown Student",
      itemName: collection.inventory_items?.name || "Unknown Item",
      sessionName: collection.academic_session_terms?.name || "No Session",
      // Include nested objects for additional data access
      students: collection.students,
      inventory_items: collection.inventory_items,
      academic_session_terms: collection.academic_session_terms,
      school_classes: collection.school_classes,
    })
  );

  const addMutation = useMutation({
    mutationFn: studentCollectionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-collections"] });
      toast({
        title: "Success",
        description: "Collection added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add collection",
        variant: "destructive",
      });
    },
  });

  const bulkUpsertMutation = useMutation({
    mutationFn: studentCollectionsApi.bulkUpsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-collections"] });
      toast({
        title: "Success",
        description: "Collections updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update collections",
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
      data: Partial<StudentCollection>;
    }) => studentCollectionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-collections"] });
      toast({
        title: "Success",
        description: "Collection updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update collection",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: studentCollectionsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-collections"] });
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete collection",
        variant: "destructive",
      });
    },
  });

  const addCollection = (collection: {
    student_id: string;
    class_id: string;
    session_term_id: string;
    inventory_item_id: string;
    qty: number;
    eligible: boolean;
    received: boolean;
  }) => {
    addMutation.mutate(collection);
  };

  const addMultipleCollections = async (
    newCollections: {
      student_id: string;
      class_id: string;
      session_term_id: string;
      inventory_item_id: string;
      qty: number;
      eligible: boolean;
      received: boolean;
    }[]
  ) => {
    return bulkUpsertMutation.mutateAsync(newCollections);
  };

  const updateCollection = async (
    id: string,
    updates: Partial<StudentCollection>
  ) => {
    return updateMutation.mutateAsync({ id, data: updates });
  };

  const deleteCollection = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    collections,
    isLoading,
    error,
    addCollection,
    addMultipleCollections,
    updateCollection,
    deleteCollection,
  };
}
