import { useQuery } from "@tanstack/react-query";
import {
  accountTransactionsApi,
  type StudentTransactionLogData,
} from "@/lib/api";
export function useStudentTransactionLog(
  params: {
    studentId: string;
    datefrom?: string;
    dateTo?: string;
  } | null
) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["student-transaction-log", params],
    queryFn: async () => {
      if (params == null || !params.studentId) return null;
      const res = await accountTransactionsApi.studentTransactionLog({
        studentId: params.studentId,
        datefrom: params.datefrom,
        dateTo: params.dateTo,
      });
      if (!res?.success) throw new Error(res?.message || "Failed to load student transaction log");
      return res.data as StudentTransactionLogData;
    },
    enabled: params != null && Boolean(params.studentId),
    staleTime: 15_000,
  });

  return {
    log: data,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
