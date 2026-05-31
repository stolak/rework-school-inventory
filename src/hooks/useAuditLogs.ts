import { useQuery } from "@tanstack/react-query";
import { auditLogsApi, type AuditLog } from "@/lib/api";

export type { AuditLog };

export function useMyAuditLogs(params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 5;

  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-logs", "me", page, limit],
    queryFn: async () => {
      const res = await auditLogsApi.listMine({ page, limit });
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load audit logs");
      }
      return {
        auditLogs: res.data?.auditLogs ?? [],
        pagination: res.data?.pagination ?? null,
      };
    },
  });

  return {
    auditLogs: data?.auditLogs ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    error,
  };
}
