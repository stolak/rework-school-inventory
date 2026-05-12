import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  studentConcessionDiscountsApi,
  type Pagination,
  type StudentConcessionDiscountBulkEntry,
  type StudentConcessionDiscountRow,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type StudentConcessionDiscountsListParams = {
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  page?: number;
  limit?: number;
};

export type BulkStudentConcessionDiscountsBody = {
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  entries: StudentConcessionDiscountBulkEntry[];
};

function unwrapList(
  res: Awaited<ReturnType<typeof studentConcessionDiscountsApi.list>>
): {
  rows: StudentConcessionDiscountRow[];
  pagination: Pagination | null;
} {
  if (!res.success) throw new Error(res.message || "Failed to load student concession discounts");
  const data = res.data as {
    studentConcessionDiscounts?: StudentConcessionDiscountRow[];
    pagination?: Pagination;
  };
  return {
    rows: data.studentConcessionDiscounts ?? [],
    pagination: data.pagination ?? null,
  };
}

export function useStudentConcessionDiscountsQuery(
  params: StudentConcessionDiscountsListParams | null
) {
  const enabled =
    Boolean(params?.studentId) &&
    Boolean(params?.classId) &&
    Boolean(params?.subclassId) &&
    Boolean(params?.session) &&
    Boolean(params?.term);

  return useQuery({
    queryKey: ["student-concession-discounts", params],
    queryFn: async () => {
      if (!params) throw new Error("Missing filters");
      return unwrapList(await studentConcessionDiscountsApi.list(params));
    },
    enabled,
    staleTime: 15_000,
  });
}

export function useStudentConcessionDiscountsMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["student-concession-discounts"] });
  };

  const bulkCreate = useMutation({
    mutationFn: (body: BulkStudentConcessionDiscountsBody) =>
      studentConcessionDiscountsApi.bulkCreate(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Student concession/discount lines created",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create concession/discount lines",
        variant: "destructive",
      });
    },
  });

  const updateAmount = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      studentConcessionDiscountsApi.update(id, { amount }),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Concession/discount updated",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update",
        variant: "destructive",
      });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => studentConcessionDiscountsApi.remove(id),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: (res as { message?: string }).message || "Line deleted",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const bulkPatchStatuses = useMutation({
    mutationFn: (
      body: Parameters<typeof studentConcessionDiscountsApi.bulkPatchStatuses>[0]
    ) => studentConcessionDiscountsApi.bulkPatchStatuses(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Statuses updated",
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

  return {
    bulkCreate: bulkCreate.mutateAsync,
    updateAmount: updateAmount.mutateAsync,
    remove: remove.mutateAsync,
    bulkPatchStatuses: bulkPatchStatuses.mutateAsync,
    isBulkCreating: bulkCreate.isPending,
    isUpdating: updateAmount.isPending,
    isDeleting: remove.isPending,
    isBulkPatchingStatus: bulkPatchStatuses.isPending,
  };
}
