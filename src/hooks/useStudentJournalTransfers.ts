import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  accountTransactionsApi,
  type StudentJournalTransferPostBody,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type { StudentJournalTransferPostBody } from "@/lib/api";

export type StudentJournalTransfersListParams = {
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  allStudents?: boolean;
};

export function useStudentAccountBalance(studentId: string | null | undefined) {
  const id = studentId?.trim() ?? "";
  return useQuery({
    queryKey: ["student-account-balance", id],
    queryFn: async () => {
      const res = await accountTransactionsApi.studentBalance({ studentId: id });
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load student balance");
      }
      return res.data;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useStudentJournalTransfersList(
  params: StudentJournalTransfersListParams | null
) {
  return useQuery({
    queryKey: ["student-journal-transfers", params],
    queryFn: async () => {
      if (!params) throw new Error("Missing filters");
      const res = await accountTransactionsApi.listStudentJournalTransfers({
        studentId: params.allStudents ? undefined : params.studentId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      });
      if (!res.success) throw new Error(res.message || "Failed to load transfers");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled:
      Boolean(params) &&
      (Boolean(params.allStudents) || Boolean(params.studentId)),
    staleTime: 15_000,
  });
}

export function useCreateStudentJournalTransfer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (body: StudentJournalTransferPostBody) =>
      accountTransactionsApi.postStudentJournalTransfer(body),
    onSuccess: (res) => {
      const ref = res.data?.ref;
      toast({
        title: "Transfer posted",
        description: ref
          ? `${res.message || "Success"} (${ref})`
          : res.message || "Student journal transfer posted",
      });
      queryClient.invalidateQueries({ queryKey: ["student-journal-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["student-account-balance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post student journal transfer",
        variant: "destructive",
      });
    },
  });
}
