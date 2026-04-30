import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentCollectionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface StudentCollection {
  id: string;
  itemId: string;
  qtyOut: number;
  referenceNo: string | null;
  notes: string | null;
  studentId: string | null;
  classId: string | null;
  sessionId: string | null;
  termId: string | null;
  subclassId: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields for display
  studentName?: string;
  itemName?: string;
  createdByName?: string;

  /**
   * Backward-compatible aliases used by older pages/components.
   * These allow existing report screens to compile while the UI is migrated.
   */
  student_id?: string;
  class_id?: string;
  session_term_id?: string;
  inventory_item_id?: string;
  qty?: number;
  eligible?: boolean;
  received?: boolean;
  created_at?: string;
  updated_at?: string;

  // Legacy nested objects referenced by older report pages
  students?: any;
  inventory_items?: any;
  academic_session_terms?: any;
  school_classes?: any;
  sessionName?: string;
}

export function useStudentCollections(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  classId?: string;
  subclassId?: string;
  sessionId?: string;
  termId?: string;
  itemId?: string;
  referenceNo?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
  // Backward-compatible aliases used by older callers/pages
  student_id?: string;
  class_id?: string;
  session_term_id?: string;
  inventory_item_id?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: raw = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student-collections", params],
    queryFn: () => studentCollectionsApi.list(params),
  });

  const rawCollections = raw?.data?.studentCollections ?? [];

  // Transform backend data to frontend format
  const collections: StudentCollection[] = rawCollections.map(
    (collection: any) => ({
      id: collection.id,
      itemId: collection.itemId,
      qtyOut: Number(collection.qtyOut ?? 0),
      referenceNo: collection.referenceNo ?? null,
      notes: collection.notes ?? null,
      studentId: collection.studentId ?? null,
      classId: collection.classId ?? null,
      sessionId: collection.sessionId ?? null,
      termId: collection.termId ?? null,
      subclassId: collection.subclassId ?? null,
      transactionDate: collection.transactionDate,
      createdById: collection.createdById,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      studentName: collection.student
        ? `${collection.student.firstName ?? ""} ${collection.student.lastName ?? ""}`.trim() ||
          "Unknown Student"
        : "Unknown Student",
      itemName: collection.item?.name || "Unknown Item",
      createdByName: collection.createdBy
        ? `${collection.createdBy.firstName ?? ""} ${collection.createdBy.lastName ?? ""}`.trim()
        : undefined,
      sessionName: undefined,

      // Backward-compatible aliases
      student_id: collection.studentId ?? undefined,
      class_id: collection.classId ?? undefined,
      session_term_id: (collection.sessionId ?? collection.termId) ?? undefined,
      inventory_item_id: collection.itemId ?? undefined,
      qty: Number(collection.qtyOut ?? 0),
      eligible: true,
      received: true,
      created_at: collection.createdAt ?? undefined,
      updated_at: collection.updatedAt ?? undefined,

      // Legacy nested objects (not provided by new API)
      students: collection.student
        ? {
            id: collection.student.id,
            first_name: collection.student.firstName,
            last_name: collection.student.lastName,
            admission_number: collection.student.admissionNumber,
          }
        : undefined,
      inventory_items: undefined,
      academic_session_terms: undefined,
      school_classes: undefined,
    })
  );

  const bulkCreateMutation = useMutation({
    mutationFn: studentCollectionsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-collections"] });
      toast({
        title: "Success",
        description: "Student collection created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create student collection",
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

  const createBulkCollection = async (payload: {
    studentId: string;
    notes?: string;
    transactionDate: string;
    items: { itemId: string; qtyOut: number }[];
  }) => {
    return bulkCreateMutation.mutateAsync(payload);
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
    createBulkCollection,
    updateCollection,
    deleteCollection,
    pagination: raw?.data?.pagination,
  };
}
