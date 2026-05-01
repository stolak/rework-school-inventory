import { useQuery } from "@tanstack/react-query";
import { staffApi, type Staff } from "@/lib/api";

export function useStaff(params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["staff", page, limit],
    queryFn: () => staffApi.list({ page, limit }),
  });

  const staff: Staff[] = (response as any)?.data?.staff ?? [];
  const pagination = (response as any)?.data?.pagination;

  return {
    staff,
    pagination,
    isLoading,
    error,
  };
}

