import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  studentBillingsApi,
  type Pagination,
  type StudentBillingBulkEntry,
  type StudentBillingRow,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type StudentBillingsListParams = {
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  page?: number;
  limit?: number;
};

export type BulkStudentBillingsBody = {
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  entries: StudentBillingBulkEntry[];
};

function unwrapList(res: Awaited<ReturnType<typeof studentBillingsApi.list>>): {
  rows: StudentBillingRow[];
  pagination: Pagination | null;
} {
  if (!res.success) throw new Error(res.message || "Failed to load student billings");
  const data = res.data as {
    studentBillings?: StudentBillingRow[];
    pagination?: Pagination;
  };
  return {
    rows: data.studentBillings ?? [],
    pagination: data.pagination ?? null,
  };
}

export function useStudentBillingsQuery(params: StudentBillingsListParams | null) {
  const enabled =
    Boolean(params?.studentId) &&
    Boolean(params?.classId) &&
    Boolean(params?.subclassId) &&
    Boolean(params?.session) &&
    Boolean(params?.term);

  return useQuery({
    queryKey: ["student-billings", params],
    queryFn: async () => {
      if (!params) throw new Error("Missing filters");
      return unwrapList(await studentBillingsApi.list(params));
    },
    enabled,
    staleTime: 15_000,
  });
}

export function useStudentBillingsMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["student-billings"] });
  };

  const bulkCreate = useMutation({
    mutationFn: (body: BulkStudentBillingsBody) => studentBillingsApi.bulkCreate(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Student billings created",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create billings",
        variant: "destructive",
      });
    },
  });

  const updateAmount = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      studentBillingsApi.update(id, { amount }),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Billing updated",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update billing",
        variant: "destructive",
      });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => studentBillingsApi.remove(id),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: (res as { message?: string }).message || "Billing deleted",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete billing",
        variant: "destructive",
      });
    },
  });

  const bulkPatchStatuses = useMutation({
    mutationFn: (body: Parameters<typeof studentBillingsApi.bulkPatchStatuses>[0]) =>
      studentBillingsApi.bulkPatchStatuses(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Billing statuses updated",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update statuses",
        variant: "destructive",
      });
    },
  });

  const bulkPost = useMutation({
    mutationFn: (body: { ids: number[] }) => studentBillingsApi.bulkPost(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Billings posted",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post billings",
        variant: "destructive",
      });
    },
  });

  return {
    bulkCreate: bulkCreate.mutateAsync,
    updateAmount: updateAmount.mutateAsync,
    remove: remove.mutateAsync,
    bulkPatchStatuses: bulkPatchStatuses.mutateAsync,
    bulkPost: bulkPost.mutateAsync,
    isBulkCreating: bulkCreate.isPending,
    isUpdating: updateAmount.isPending,
    isDeleting: remove.isPending,
    isBulkPatchingStatus: bulkPatchStatuses.isPending,
    isBulkPosting: bulkPost.isPending,
  };
}
